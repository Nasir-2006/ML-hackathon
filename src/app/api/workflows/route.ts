import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { incidents } from "@/db/schema";
import { createWorkflow } from "@/lib/workflow";
import { actorFrom, errorResponse, parseBody, respond } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await parseBody(req);
  const incidentId = parseInt(body.incidentId || "", 10);
  const playbook = body.playbook || "";

  if (!incidentId || !playbook) {
    return errorResponse(req, "/incidents", "incidentId and playbook are required.");
  }

  const inc = await db.query.incidents.findFirst({ where: eq(incidents.id, incidentId) });
  if (!inc) return errorResponse(req, "/incidents", "Incident not found.");

  const wf = await createWorkflow(incidentId, playbook, actorFrom(body));

  return respond(req, `/incidents/${incidentId}?wf=${wf.id}`, {
    ok: true,
    workflowId: wf.id,
  });
}
