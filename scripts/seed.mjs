// One-shot idempotent seed: establishes the documented manual baseline and a
// few measured runs (including one paused for recovery) so the impact report
// and workflow engine have realistic data immediately.
import { Pool } from "pg";

const conn = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
const pool = new Pool({ connectionString: conn });

const rid = (p) => `${p}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

async function insertId(text, values) {
  const { rows } = await pool.query(`${text} RETURNING id`, values);
  return rows[0].id;
}

// ---- Playbook step templates (mirror src/lib/playbooks.ts) ----
const PB = {
  flood_response: [
    { tool: "weather_feed", appr: false, out: () => ({ source: "NOAA Hydromet + Local Radar", riverGauge: "Zone A gauge", stageFt: "11.2", rainfallMm1h: 58, trend: "rising" }) },
    { tool: "responder_pager", appr: false, out: () => ({ pagedTeams: ["Fire", "EMS", "Public Works", "Swift-Water Rescue"], ackTargetMin: 5, dispatchId: rid("DSP") }) },
    { tool: "shelter_activate", appr: false, out: () => ({ sheltersOpened: ["Lincoln HS", "Civic Center"], capacity: 400, cotsDispatched: 200, activationId: rid("SHL") }) },
    { tool: "evac_order", appr: true, impact: "critical", out: () => ({ orderId: rid("EVO"), zones: ["Zone A", "Zone B"], publishedTo: ["emergency.city.gov", "Waze", "311", "Local TV"], effectiveAt: new Date().toISOString(), legalCited: "Mun. Code § 9.04" }) },
    { tool: "sms_broadcast", appr: true, impact: "high", out: (p) => ({ provider: "TitanSMS Gateway", messageId: rid("SMS"), recipients: p.recipients ?? 3200, segments: 21, deliveredEstimatePct: 97 }) },
    { tool: "utility_notify", appr: true, impact: "high", out: () => ({ utility: "Metro Gas & Electric", action: "Cut power, Stage crews", ticket: rid("UTL"), etaMin: 30 }) },
    { tool: "status_page", appr: false, out: () => ({ pageId: "emergency.city.gov/status", lastUpdated: new Date().toISOString(), revision: rid("ST") }) },
    { tool: "social_media", appr: true, impact: "medium", out: () => ({ platform: "City Emergency Accounts", postId: rid("SOC"), reachEstimate: 85000 }) },
  ],
  fire_response: [
    { tool: "responder_pager", appr: false, out: () => ({ pagedTeams: ["Fire", "EMS", "Air Operations"], ackTargetMin: 5, dispatchId: rid("DSP") }) },
    { tool: "shelter_activate", appr: false, out: () => ({ sheltersOpened: ["Eastside MS"], capacity: 300, cotsDispatched: 180, activationId: rid("SHL") }) },
    { tool: "evac_order", appr: true, impact: "critical", out: () => ({ orderId: rid("EVO"), zones: ["Ridge District"], publishedTo: ["emergency.city.gov", "Waze", "311"], effectiveAt: new Date().toISOString(), legalCited: "Mun. Code § 9.04" }) },
    { tool: "sms_broadcast", appr: true, impact: "high", out: (p) => ({ provider: "TitanSMS Gateway", messageId: rid("SMS"), recipients: p.recipients ?? 2100, segments: 14, deliveredEstimatePct: 96 }) },
    { tool: "utility_notify", appr: true, impact: "high", out: () => ({ utility: "Metro Gas & Electric", action: "Shut gas mains", ticket: rid("UTL"), etaMin: 20 }) },
    { tool: "status_page", appr: false, out: () => ({ pageId: "emergency.city.gov/status", lastUpdated: new Date().toISOString(), revision: rid("ST") }) },
    { tool: "social_media", appr: true, impact: "medium", out: () => ({ platform: "City Emergency Accounts", postId: rid("SOC"), reachEstimate: 64000 }) },
  ],
  severe_weather: [
    { tool: "weather_feed", appr: false, out: () => ({ source: "NOAA Hydromet + Local Radar", riverGauge: "North gauge", stageFt: "6.1", rainfallMm1h: 41, trend: "rising" }) },
    { tool: "sms_broadcast", appr: true, impact: "high", out: (p) => ({ provider: "TitanSMS Gateway", messageId: rid("SMS"), recipients: p.recipients ?? 5400, segments: 35, deliveredEstimatePct: 95 }) },
    { tool: "shelter_activate", appr: false, out: () => ({ sheltersOpened: ["Civic Center"], capacity: 250, cotsDispatched: 150, activationId: rid("SHL") }) },
    { tool: "status_page", appr: false, out: () => ({ pageId: "emergency.city.gov/status", lastUpdated: new Date().toISOString(), revision: rid("ST") }) },
    { tool: "social_media", appr: true, impact: "medium", out: () => ({ platform: "City Emergency Accounts", postId: rid("SOC"), reachEstimate: 91000 }) },
  ],
};

function paramsFor(tool, incident) {
  if (tool === "sms_broadcast") return { recipients: incident.populationAtRisk ?? 1000 };
  if (tool === "shelter_activate") return { shelters: ["Civic Center"], capacity: 300 };
  if (tool === "evac_order") return { zones: [incident.zone || "Zone A"] };
  if (tool === "utility_notify") return { utility: "Metro Gas & Electric", action: "Stage crews" };
  if (tool === "responder_pager") return { teams: ["Fire", "EMS", "Public Works"] };
  return {};
}

async function seedCompletedIncident(inc, slug, daysAgo, durationMin) {
  const incId = await insertId(
    `INSERT INTO incidents (reference, title, type, severity, status, location, zone, population_at_risk, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW() - $9 * interval '1 day', NOW() - $9 * interval '1 day')`,
    [rid("INC"), inc.title, inc.type, inc.severity, inc.status, inc.location, inc.zone, inc.populationAtRisk, daysAgo],
  );

  const start = new Date(Date.now() - daysAgo * 86400000);
  const wfId = await insertId(
    `INSERT INTO workflows (incident_id, playbook, name, status, started_at, finished_at, created_at)
     VALUES ($1,$2,$3,'completed',$4,$5,NOW() - $6 * interval '1 day')`,
    [incId, slug, slug.replace("_", " "), start, new Date(start.getTime() + durationMin * 60000), daysAgo],
  );

  const steps = PB[slug];
  let t = start.getTime();
  const gap = Math.floor((durationMin * 60000) / steps.length);
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    t += gap;
    const out = s.out(paramsFor(s.tool, inc));
    const params = paramsFor(s.tool, inc);
    const stepId = await insertId(
      `INSERT INTO workflow_steps (workflow_id, position, name, tool, requires_approval, approval_status, approved_by, approved_at, params, status, result, executed_at, attempt_count, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'succeeded',$10,$11,1,NOW() - $12 * interval '1 day')`,
      [
        wfId, i + 1, s.tool, s.tool, s.appr, s.appr ? "approved" : "not_required",
        s.appr ? "Cmdr. A. Reyes" : null, s.appr ? new Date(t - 40000) : null,
        params, out, new Date(t), daysAgo,
      ],
    );
    if (s.appr) {
      const evId = await insertId(
        `INSERT INTO evidence (reference, step_id, workflow_id, incident_id, action, actor, approver, tool, impact, payload, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW() - $11 * interval '1 day')`,
        [
          rid("EVD"), stepId, wfId, incId, s.tool, "Dispatch Console", "Cmdr. A. Reyes", s.tool,
          s.impact || "high", { output: out, params, incident: { reference: "INC", title: inc.title }, attemptedAt: new Date(t).toISOString() }, daysAgo,
        ],
      );
      await pool.query(`UPDATE workflow_steps SET evidence_id=$1 WHERE id=$2`, [evId, stepId]);
    }
  }
  // mark incident resolved for the older one
  await pool.query(`UPDATE incidents SET resolved_at = NOW() - ($1::int - 0) * interval '1 day' WHERE id=$2`, [daysAgo, incId]);
}

async function seedRecoveryIncident(inc, slug, daysAgo) {
  const incId = await insertId(
    `INSERT INTO incidents (reference, title, type, severity, status, location, zone, population_at_risk, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW() - $9 * interval '1 day', NOW() - $9 * interval '1 day')`,
    [rid("INC"), inc.title, inc.type, inc.severity, inc.status, inc.location, inc.zone, inc.populationAtRisk, daysAgo],
  );
  const start = new Date(Date.now() - daysAgo * 86400000);
  const wfId = await insertId(
    `INSERT INTO workflows (incident_id, playbook, name, status, started_at, created_at)
     VALUES ($1,$2,$3,'needs_recovery',$4,NOW() - $5 * interval '1 day')`,
    [incId, slug, slug.replace("_", " "), start, daysAgo],
  );
  const steps = PB[slug];
  let t = start.getTime();
  const gap = 30000;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const params = paramsFor(s.tool, inc);
    if (i === 0) {
      // first step succeeded
      t += gap;
      await insertId(
        `INSERT INTO workflow_steps (workflow_id, position, name, tool, requires_approval, approval_status, params, status, result, executed_at, attempt_count, created_at)
         VALUES ($1,$2,$3,$4,$5,'not_required',$6,'succeeded',$7,$8,1,NOW() - $9 * interval '1 day')`,
        [wfId, i + 1, s.tool, s.tool, s.appr, params, s.out(params), new Date(t), daysAgo],
      );
    } else if (i === 1) {
      // second step (a consequential SMS) failed — simulated tool outage
      t += gap;
      await insertId(
        `INSERT INTO workflow_steps (workflow_id, position, name, tool, requires_approval, approval_status, params, status, error_message, attempt_count, last_attempt_at, created_at)
         VALUES ($1,$2,$3,$4,$5,'requested',$6,'failed',$7,1,$8,NOW() - $9 * interval '1 day')`,
        [
          wfId, i + 1, s.tool, s.tool, s.appr, params,
          'Tool "Mass SMS Alert" is currently unavailable — workflow paused for recovery.', new Date(t), daysAgo,
        ],
      );
    } else {
      // remaining steps never ran (workflow paused)
      await insertId(
        `INSERT INTO workflow_steps (workflow_id, position, name, tool, requires_approval, approval_status, params, status, created_at)
         VALUES ($1,$2,$3,$4,$5,'not_required',$6,'pending',NOW() - $7 * interval '1 day')`,
        [wfId, i + 1, s.tool, s.tool, s.appr, params, daysAgo],
      );
    }
  }
}

async function main() {
  const { rows } = await pool.query(`SELECT count(*)::int AS c FROM incidents`);
  if (rows[0].c > 0) {
    console.log("Seed skipped — incidents already present.");
    await pool.end();
    return;
  }

  await pool.query(
    `INSERT INTO baseline (label, manual_steps, manual_tools, manual_minutes, manual_errors_per_incident, source)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      "Illustrative response-workflow baseline",
      14,
      6,
      47,
      "3.40",
      "Demonstration benchmark fixture only — not an audited municipal study. Replace with approved timed observations and validated error data before making real-world impact claims.",
    ],
  );

  // The seeded failed SMS step is an intentional recovery drill. Keep the
  // corresponding tool visibly unavailable until a responder restores it.
  await pool.query(
    `INSERT INTO tool_status (tool, available, note, updated_at)
     VALUES ('sms_broadcast', false, 'Simulated outage for seeded recovery drill', NOW())
     ON CONFLICT (tool) DO UPDATE
     SET available = false, note = EXCLUDED.note, updated_at = NOW()`,
  );

  await seedCompletedIncident(
    { title: "Flash flooding — Riverside underpass", type: "flood", severity: 4, status: "resolved", location: "Riverside District, 4th & Main", zone: "Zone A", populationAtRisk: 3200 },
    "flood_response",
    3,
    4.2,
  );
  await seedCompletedIncident(
    { title: "Wildfire — Ridge District", type: "fire", severity: 5, status: "contained", location: "Ridge District", zone: "Ridge District", populationAtRisk: 2100 },
    "fire_response",
    2,
    3.6,
  );
  await seedRecoveryIncident(
    { title: "Severe thunderstorm cell — North County", type: "severe_weather", severity: 3, status: "active", location: "North County", zone: "North County", populationAtRisk: 5400 },
    "severe_weather",
    0,
  );

  console.log("Seed complete.");
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
