import { NextRequest } from "next/server";
import { db } from "@/db";
import { incidents } from "@/db/schema";
import { createWorkflow } from "@/lib/workflow";
import { actorFrom, errorResponse, parseBody, respond } from "@/lib/api";

function ref(): string {
  return `INC-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await parseBody(req);
  const title = (body.title || "").trim();
  const location = (body.location || "").trim();
  const type = body.type || "flood";

  if (!title || !location) {
    return errorResponse(req, "/incidents/new", "Title and location are required.");
  }

  const severity = Math.min(5, Math.max(1, parseInt(body.severity || "3", 10) || 3));
  const populationAtRisk = body.populationAtRisk
    ? Math.max(0, parseInt(body.populationAtRisk, 10) || 0)
    : null;

  const [inc] = await db
    .insert(incidents)
    .values({
      reference: ref(),
      title,
      type,
      severity,
      status: "active",
      location,
      zone: body.zone || null,
      populationAtRisk,
    })
    .returning();

  const actor = actorFrom(body);
  let wfId: number | null = null;
  if (body.playbook) {
    try {
      const wf = await createWorkflow(inc.id, body.playbook, actor);
      wfId = wf.id;
    } catch {
      // Incident created; playbook launch can be retried from the incident page.
    }
  }

  return respond(req, `/incidents/${inc.id}${wfId ? `?wf=${wfId}` : ""}`, {
    ok: true,
    incidentId: inc.id,
    workflowId: wfId,
  });
}
