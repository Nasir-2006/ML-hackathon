import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  evidence,
  incidents,
  toolStatus,
  workflowSteps,
  workflows,
} from "@/db/schema";
import { TOOLS } from "@/lib/tools";

export async function listIncidents() {
  const rows = await db.query.incidents.findMany({ orderBy: desc(incidents.createdAt) });
  const out = [];
  for (const inc of rows) {
    const wfs = await db.query.workflows.findMany({
      where: eq(workflows.incidentId, inc.id),
      orderBy: desc(workflows.createdAt),
    });
    out.push({ incident: inc, workflows: wfs });
  }
  return out;
}

export async function getIncidentWithWorkflows(id: number) {
  const incident = await db.query.incidents.findFirst({ where: eq(incidents.id, id) });
  if (!incident) return null;
  const wfs = await db.query.workflows.findMany({
    where: eq(workflows.incidentId, incident.id),
    orderBy: desc(workflows.createdAt),
  });
  const stepsByWf: Record<number, Awaited<ReturnType<typeof db.query.workflowSteps.findMany>>> = {};
  for (const wf of wfs) {
    stepsByWf[wf.id] = await db.query.workflowSteps.findMany({
      where: eq(workflowSteps.workflowId, wf.id),
      orderBy: workflowSteps.position,
    });
  }
  return { incident, workflows: wfs, stepsByWf };
}

export async function getWorkflowDetail(workflowId: number) {
  const wf = await db.query.workflows.findFirst({ where: eq(workflows.id, workflowId) });
  if (!wf) return null;
  const incident = await db.query.incidents.findFirst({ where: eq(incidents.id, wf.incidentId) });
  const steps = await db.query.workflowSteps.findMany({
    where: eq(workflowSteps.workflowId, wf.id),
    orderBy: workflowSteps.position,
  });
  return { wf, incident, steps };
}

/** Steps awaiting human approval across every incident (the human-review path). */
export async function listApprovals() {
  const steps = await db.query.workflowSteps.findMany({
    where: and(
      eq(workflowSteps.approvalStatus, "requested"),
      eq(workflowSteps.status, "waiting"),
    ),
    orderBy: workflowSteps.position,
  });
  const out = [];
  for (const step of steps) {
    const wf = await db.query.workflows.findFirst({ where: eq(workflows.id, step.workflowId) });
    const inc = wf
      ? await db.query.incidents.findFirst({ where: eq(incidents.id, wf.incidentId) })
      : null;
    out.push({ step, workflow: wf, incident: inc });
  }
  return out;
}

export async function listEvidence() {
  const rows = await db.query.evidence.findMany({ orderBy: desc(evidence.createdAt) });
  const out = [];
  for (const ev of rows) {
    const inc = await db.query.incidents.findFirst({ where: eq(incidents.id, ev.incidentId) });
    out.push({ evidence: ev, incident: inc });
  }
  return out;
}

export async function getEvidenceDetail(id: number) {
  const ev = await db.query.evidence.findFirst({ where: eq(evidence.id, id) });
  if (!ev) return null;
  const inc = await db.query.incidents.findFirst({ where: eq(incidents.id, ev.incidentId) });
  const step = await db.query.workflowSteps.findFirst({ where: eq(workflowSteps.id, ev.stepId) });
  return { evidence: ev, incident: inc, step };
}

export async function getToolStatuses() {
  const rows = await db.query.toolStatus.findMany();
  const map = new Map(rows.map((r) => [r.tool, r]));
  return TOOLS
    ? Object.keys(TOOLS).map((key) => {
        const def = TOOLS[key];
        const row = map.get(key);
        return {
          key,
          label: def.label,
          impact: def.impact,
          consequential: def.consequential,
          description: def.description,
          available: row ? row.available : true,
          note: row?.note ?? null,
        };
      })
    : [];
}

export async function countPendingApprovals(): Promise<number> {
  const rows = await db
    .select({ c: sql<number>`count(*)` })
    .from(workflowSteps)
    .where(and(eq(workflowSteps.approvalStatus, "requested"), eq(workflowSteps.status, "waiting")));
  return Number(rows[0]?.c ?? 0);
}

export async function countActiveIncidents(): Promise<number> {
  const rows = await db
    .select({ c: sql<number>`count(*)` })
    .from(incidents)
    .where(eq(incidents.status, "active"));
  return Number(rows[0]?.c ?? 0);
}

export interface WorkflowRunRow {
  wfId: number;
  incidentId: number;
  incidentRef: string;
  incidentTitle: string;
  incidentType: string;
  wfName: string;
  status: string;
  dur: number | null;
  done: number;
  total: number;
  approvals: number;
  failed: number;
}

/** Flatten every workflow into a measured-run row for the impact report. */
export async function getWorkflowRuns(): Promise<WorkflowRunRow[]> {
  const wfs = await db.query.workflows.findMany({ orderBy: desc(workflows.createdAt) });
  const out: WorkflowRunRow[] = [];
  for (const wf of wfs) {
    const inc = await db.query.incidents.findFirst({ where: eq(incidents.id, wf.incidentId) });
    const steps = await db.query.workflowSteps.findMany({
      where: eq(workflowSteps.workflowId, wf.id),
    });
    out.push({
      wfId: wf.id,
      incidentId: wf.incidentId,
      incidentRef: inc?.reference ?? "—",
      incidentTitle: inc?.title ?? "Unknown",
      incidentType: inc?.type ?? "flood",
      wfName: wf.name,
      status: wf.status,
      dur:
        wf.startedAt && wf.finishedAt
          ? (wf.finishedAt.getTime() - wf.startedAt.getTime()) / 60000
          : null,
      done: steps.filter((s) => s.status === "succeeded").length,
      total: steps.length,
      approvals: steps.filter((s) => s.approvalStatus === "approved").length,
      failed: steps.filter((s) => s.status === "failed").length,
    });
  }
  return out;
}
