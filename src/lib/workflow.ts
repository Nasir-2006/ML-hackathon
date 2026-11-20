import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLog,
  baseline,
  evidence,
  incidents,
  toolStatus,
  workflowSteps,
  workflows,
} from "@/db/schema";
import { getPlaybook } from "@/lib/playbooks";
import { getTool, type StepContext } from "@/lib/tools";

const TERMINAL = ["succeeded", "failed", "skipped"] as const;
const RUNNABLE = ["running", "awaiting_approval"] as const;

function ref(prefix: string, len = 8): string {
  const r = Math.random().toString(36).slice(2, 2 + len).toUpperCase();
  return `${prefix}-${r}`;
}

async function audit(
  action: string,
  opts: {
    incidentId?: number;
    workflowId?: number;
    stepId?: number;
    actor?: string;
    detail?: Record<string, unknown>;
  } = {},
) {
  await db.insert(auditLog).values({
    action,
    incidentId: opts.incidentId ?? null,
    workflowId: opts.workflowId ?? null,
    stepId: opts.stepId ?? null,
    actor: opts.actor ?? "system",
    detail: opts.detail ?? {},
  });
}

async function isToolAvailable(tool: string): Promise<boolean> {
  const row = await db.query.toolStatus.findFirst({
    where: eq(toolStatus.tool, tool),
  });
  return row ? row.available : true;
}

async function setWorkflowStatus(workflowId: number, status: string) {
  await db
    .update(workflows)
    .set({ status, finishedAt: status === "completed" || status === "aborted" ? new Date() : null })
    .where(eq(workflows.id, workflowId));
}

async function getSteps(workflowId: number) {
  return db.query.workflowSteps.findMany({
    where: eq(workflowSteps.workflowId, workflowId),
    orderBy: asc(workflowSteps.position),
  });
}

async function buildContext(stepId: number): Promise<StepContext> {
  const step = await db.query.workflowSteps.findFirst({
    where: eq(workflowSteps.id, stepId),
  });
  if (!step) throw new Error("step not found");
  const wf = await db.query.workflows.findFirst({
    where: eq(workflows.id, step.workflowId),
  });
  const inc = await db.query.incidents.findFirst({
    where: eq(incidents.id, wf!.incidentId),
  });
  return {
    params: (step.params as Record<string, unknown>) ?? {},
    incident: {
      reference: inc!.reference,
      title: inc!.title,
      zone: inc!.zone,
      location: inc!.location,
      populationAtRisk: inc!.populationAtRisk,
      severity: inc!.severity,
    },
  };
}

/** Execute a single step. Returns true on success. */
async function executeStep(stepId: number, actor: string): Promise<boolean> {
  const step = await db.query.workflowSteps.findFirst({
    where: eq(workflowSteps.id, stepId),
  });
  if (!step) return false;

  await db
    .update(workflowSteps)
    .set({
      status: "executing",
      attemptCount: step.attemptCount + 1,
      lastAttemptAt: new Date(),
      errorMessage: null,
    })
    .where(eq(workflowSteps.id, stepId));

  const tool = getTool(step.tool);
  if (!tool) {
    await db
      .update(workflowSteps)
      .set({ status: "failed", errorMessage: `Unknown tool: ${step.tool}` })
      .where(eq(workflowSteps.id, stepId));
    await setWorkflowStatus(step.workflowId, "needs_recovery");
    await audit("step_failed", {
      stepId,
      workflowId: step.workflowId,
      actor,
      detail: { reason: "unknown_tool", tool: step.tool },
    });
    return false;
  }

  const available = await isToolAvailable(step.tool);
  if (!available) {
    await db
      .update(workflowSteps)
      .set({
        status: "failed",
        errorMessage: `Tool "${tool.label}" is currently unavailable — workflow paused for recovery.`,
      })
      .where(eq(workflowSteps.id, stepId));
    await setWorkflowStatus(step.workflowId, "needs_recovery");
    await audit("step_failed", {
      stepId,
      workflowId: step.workflowId,
      actor,
      detail: { reason: "tool_unavailable", tool: step.tool },
    });
    return false;
  }

  const ctx = await buildContext(stepId);
  const res = await tool.run(ctx);

  if (!res.ok) {
    await db
      .update(workflowSteps)
      .set({ status: "failed", errorMessage: JSON.stringify(res.output) })
      .where(eq(workflowSteps.id, stepId));
    await setWorkflowStatus(step.workflowId, "needs_recovery");
    await audit("step_failed", { stepId, workflowId: step.workflowId, actor, detail: res.output });
    return false;
  }

  await db
    .update(workflowSteps)
    .set({ status: "succeeded", result: res.output, executedAt: new Date() })
    .where(eq(workflowSteps.id, stepId));

  await audit("step_succeeded", {
    stepId,
    workflowId: step.workflowId,
    actor,
    detail: res.output,
  });

  // Evidence for every consequential (high-impact) output.
  if (tool.consequential) {
    const wf = await db.query.workflows.findFirst({
      where: eq(workflows.id, step.workflowId),
    });
    const [ev] = await db
      .insert(evidence)
      .values({
        reference: ref("EVD"),
        stepId: step.id,
        workflowId: step.workflowId,
        incidentId: wf!.incidentId,
        action: step.name,
        actor,
        approver: step.approvedBy ?? undefined,
        tool: step.tool,
        impact: tool.impact,
        payload: {
          output: res.output,
          params: ctx.params,
          incident: ctx.incident,
          attemptedAt: new Date().toISOString(),
        },
      })
      .returning();
    await db.update(workflowSteps).set({ evidenceId: ev.id }).where(eq(workflowSteps.id, stepId));
  }

  return true;
}

/**
 * Drive a workflow forward from its current state. Stops when it needs a human
 * (approval), hits a failure (recovery), or finishes.
 */
export async function processWorkflow(workflowId: number, actor: string) {
  // Guard against runaway loops.
  for (let i = 0; i < 50; i++) {
    const steps = await getSteps(workflowId);
    const next = steps.find((s) => s.status === "pending" || s.status === "waiting");
    if (!next) {
      const anyRejected = steps.some(
        (s) => s.status === "skipped" && s.approvalStatus === "rejected",
      );
      await setWorkflowStatus(workflowId, anyRejected ? "aborted" : "completed");
      await audit("workflow_finished", {
        workflowId,
        actor,
        detail: { status: anyRejected ? "aborted" : "completed" },
      });
      return;
    }

    if (next.status === "waiting") {
      if (next.approvalStatus === "approved") {
        const ok = await executeStep(next.id, actor);
        if (!ok) return; // needs_recovery set inside
        continue;
      }
      await setWorkflowStatus(workflowId, "awaiting_approval");
      return;
    }

    // next.status === "pending"
    if (next.requiresApproval && next.approvalStatus !== "approved") {
      await db
        .update(workflowSteps)
        .set({ approvalStatus: "requested", status: "waiting" })
        .where(eq(workflowSteps.id, next.id));
      await setWorkflowStatus(workflowId, "awaiting_approval");
      await audit("approval_requested", {
        stepId: next.id,
        workflowId,
        actor,
        detail: { tool: next.tool, name: next.name },
      });
      return;
    }

    const ok = await executeStep(next.id, actor);
    if (!ok) return; // needs_recovery set inside
  }
}

/** Launch a playbook as a new workflow for an incident. */
export async function createWorkflow(
  incidentId: number,
  playbookSlug: string,
  actor: string,
) {
  const playbook = getPlaybook(playbookSlug);
  if (!playbook) throw new Error(`Unknown playbook: ${playbookSlug}`);

  const [wf] = await db
    .insert(workflows)
    .values({
      incidentId,
      playbook: playbook.slug,
      name: playbook.name,
      status: "running",
      startedAt: new Date(),
    })
    .returning();

  await db.insert(workflowSteps).values(
    playbook.steps.map((s, i) => ({
      workflowId: wf.id,
      position: i + 1,
      name: s.name,
      tool: s.tool,
      requiresApproval: s.requiresApproval,
      params: s.params ?? {},
    })),
  );

  await audit("workflow_started", {
    workflowId: wf.id,
    incidentId,
    actor,
    detail: { playbook: playbook.slug, steps: playbook.steps.length },
  });

  await processWorkflow(wf.id, actor);
  return wf;
}

export async function approveStep(stepId: number, actor: string, note?: string) {
  const step = await db.query.workflowSteps.findFirst({
    where: eq(workflowSteps.id, stepId),
  });
  if (!step) throw new Error("step not found");
  if (!step.requiresApproval || step.status !== "waiting" || step.approvalStatus !== "requested") {
    throw new Error("step is not awaiting approval");
  }

  await db
    .update(workflowSteps)
    .set({
      approvalStatus: "approved",
      approvedBy: actor,
      approvedAt: new Date(),
      approvalNote: note ?? null,
      status: "waiting",
    })
    .where(eq(workflowSteps.id, stepId));

  await audit("step_approved", {
    stepId,
    workflowId: step.workflowId,
    actor,
    detail: { note: note ?? null },
  });

  // Move workflow back to a runnable state and continue.
  await db
    .update(workflows)
    .set({ status: "running" })
    .where(eq(workflows.id, step.workflowId));
  await processWorkflow(step.workflowId, actor);
}

export async function rejectStep(stepId: number, actor: string, note?: string) {
  const step = await db.query.workflowSteps.findFirst({
    where: eq(workflowSteps.id, stepId),
  });
  if (!step) throw new Error("step not found");
  if (!step.requiresApproval || step.status !== "waiting" || step.approvalStatus !== "requested") {
    throw new Error("step is not awaiting approval");
  }

  await db
    .update(workflowSteps)
    .set({
      approvalStatus: "rejected",
      approvedBy: actor,
      approvedAt: new Date(),
      approvalNote: note ?? null,
      status: "skipped",
    })
    .where(eq(workflowSteps.id, stepId));

  await audit("step_rejected", {
    stepId,
    workflowId: step.workflowId,
    actor,
    detail: { note: note ?? null },
  });

  await db.update(workflows).set({ status: "running" }).where(eq(workflows.id, step.workflowId));
  await processWorkflow(step.workflowId, actor);
}

/** Recovery path: re-run a previously failed step, preserving all prior work. */
export async function retryStep(stepId: number, actor: string) {
  const step = await db.query.workflowSteps.findFirst({
    where: eq(workflowSteps.id, stepId),
  });
  if (!step) throw new Error("step not found");
  if (step.status !== "failed") throw new Error("only failed steps can be retried");

  await db
    .update(workflowSteps)
    .set({ status: "pending", errorMessage: null })
    .where(eq(workflowSteps.id, stepId));

  await db
    .update(workflows)
    .set({ status: "running", finishedAt: null })
    .where(eq(workflows.id, step.workflowId));

  await audit("step_retried", {
    stepId,
    workflowId: step.workflowId,
    actor,
    detail: { priorAttempts: step.attemptCount },
  });

  await processWorkflow(step.workflowId, actor);
}

/** Recovery path: skip a step with a recorded reason. */
export async function skipStep(stepId: number, actor: string, reason: string) {
  const step = await db.query.workflowSteps.findFirst({
    where: eq(workflowSteps.id, stepId),
  });
  if (!step) throw new Error("step not found");

  await db
    .update(workflowSteps)
    .set({
      status: "skipped",
      approvalStatus: step.requiresApproval ? "rejected" : step.approvalStatus,
      approvalNote: reason,
      approvedBy: actor,
      approvedAt: new Date(),
    })
    .where(eq(workflowSteps.id, stepId));

  await audit("step_skipped", { stepId, workflowId: step.workflowId, actor, detail: { reason } });

  await db.update(workflows).set({ status: "running" }).where(eq(workflows.id, step.workflowId));
  await processWorkflow(step.workflowId, actor);
}

export async function setToolAvailability(
  tool: string,
  available: boolean,
  note?: string,
  actor = "system",
) {
  await db
    .insert(toolStatus)
    .values({ tool, available, note: note ?? null, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: toolStatus.tool,
      set: { available, note: note ?? null, updatedAt: new Date() },
    });
  await audit("tool_availability_changed", {
    actor,
    detail: { tool, available, note: note ?? null },
  });
}

/** Summary stats used by the metrics dashboard. */
export async function getMetrics() {
  const base = await db.query.baseline.findFirst({ orderBy: desc(baseline.createdAt) });
  const all = await db.query.workflows.findMany();
  const completed = all.filter((w) => w.status === "completed" && w.startedAt && w.finishedAt);

  let totalMinutes = 0;
  let autoSteps = 0;
  let approvedSteps = 0;
  let failedSteps = 0;
  for (const w of all) {
    if (w.startedAt && w.finishedAt) {
      totalMinutes += (w.finishedAt.getTime() - w.startedAt.getTime()) / 60000;
    }
    const steps = await getSteps(w.id);
    for (const s of steps) {
      if (s.status === "succeeded" && !s.requiresApproval) autoSteps++;
      if (s.approvalStatus === "approved") approvedSteps++;
      if (s.status === "failed") failedSteps++;
    }
  }

  const count = completed.length || 0;
  const avgMinutes = count ? totalMinutes / count : 0;

  return {
    baseline: base,
    runs: all.length,
    completedRuns: count,
    avgAutomatedMinutes: avgMinutes,
    automatedSteps: autoSteps,
    approvalsPerformed: approvedSteps,
    failedSteps,
    manualMinutes: base?.manualMinutes ?? 0,
    manualSteps: base?.manualSteps ?? 0,
    manualTools: base?.manualTools ?? 0,
    manualErrors: base ? Number(base.manualErrorsPerIncident) : 0,
  };
}

export { RUNNABLE, TERMINAL };
