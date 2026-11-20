import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { incidents, workflowSteps, workflows } from "@/db/schema";
import { rejectStep } from "@/lib/workflow";
import { actorFrom, errorResponse, parseBody, respond } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stepId = parseInt(id, 10);
  if (!stepId) return errorResponse(req, "/approvals", "Invalid step.");

  const body = await parseBody(req);
  if (!body.note || !body.note.trim()) {
    return errorResponse(req, "/approvals", "A reason is required to reject a consequential action.");
  }
  const step = await db.query.workflowSteps.findFirst({ where: eq(workflowSteps.id, stepId) });
  if (!step) return errorResponse(req, "/approvals", "Step not found.");

  try {
    await rejectStep(stepId, actorFrom(body), body.note.trim());
  } catch (e) {
    return errorResponse(req, "/approvals", (e as Error).message);
  }

  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.id, step.workflowId),
  });
  const inc = workflow
    ? await db.query.incidents.findFirst({ where: eq(incidents.id, workflow.incidentId) })
    : null;
  const back = body.back || (inc ? `/incidents/${inc.id}` : "/approvals");
  return respond(req, back, { ok: true, stepId });
}
