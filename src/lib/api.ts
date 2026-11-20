import { NextRequest, NextResponse } from "next/server";

/** Accept both JSON (fetch) and form-encoded (no-JS) bodies. */
export async function parseBody(req: NextRequest): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      const json = await req.json();
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(json ?? {})) out[k] = String(v);
      return out;
    } catch {
      return {};
    }
  }
  const form = await req.formData();
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) out[k] = String(v);
  return out;
}

/**
 * JSON fetch requests get a JSON body; plain HTML form posts get a redirect.
 * This is what makes the UI work with and without JavaScript.
 */
export function respond(
  req: NextRequest,
  redirectTo: string,
  data: Record<string, unknown>,
  status = 200,
) {
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("application/json")) {
    return NextResponse.json(data, { status });
  }
  return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
}

export function errorResponse(
  req: NextRequest,
  redirectTo: string,
  message: string,
  status = 400,
) {
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("application/json")) {
    return NextResponse.json({ ok: false, error: message }, { status });
  }
  const url = new URL(redirectTo, req.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, { status: 303 });
}

export function actorFrom(body: Record<string, string>, fallback = "On-duty responder"): string {
  const a = (body.actor || "").trim();
  return a.length ? a.slice(0, 120) : fallback;
}
