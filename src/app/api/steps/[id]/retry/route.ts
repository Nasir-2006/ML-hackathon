import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { incidents, workflowSteps, workflows } from "@/db/schema";
import { retryStep } from "@/lib/workflow";
import { actorFrom, errorResponse, parseBody, respond } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stepId = parseInt(id, 10);
  if (!stepId) return errorResponse(req, "/incidents", "Invalid step.");

  const body = await parseBody(req);
  const step = await db.query.workflowSteps.findFirst({ where: eq(workflowSteps.id, stepId) });
  if (!step) return errorResponse(req, "/incidents", "Step not found.");

  try {
    await retryStep(stepId, actorFrom(body));
  } catch (e) {
    return errorResponse(req, "/incidents", (e as Error).message);
  }

  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.id, step.workflowId),
  });
  const inc = workflow
    ? await db.query.incidents.findFirst({ where: eq(incidents.id, workflow.incidentId) })
    : null;
  const back = body.back || (inc ? `/incidents/${inc.id}` : "/incidents");
  return respond(req, back, { ok: true, stepId });
}
