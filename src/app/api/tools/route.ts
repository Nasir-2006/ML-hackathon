import { NextRequest } from "next/server";
import { setToolAvailability } from "@/lib/workflow";
import { actorFrom, errorResponse, parseBody, respond } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await parseBody(req);
  const tool = body.tool || "";
  const available = body.available !== "false" && body.available !== "0";
  if (!tool) return errorResponse(req, "/tools", "tool is required.");

  try {
    await setToolAvailability(tool, available, body.note || undefined, actorFrom(body));
  } catch (e) {
    return errorResponse(req, "/tools", (e as Error).message);
  }
  return respond(req, "/tools", { ok: true, tool, available });
}
