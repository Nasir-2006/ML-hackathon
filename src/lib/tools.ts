/**
 * Mocked municipal tool integrations.
 *
 * In production each `run` would call a real external system (SMS gateway,
 * mass-notification vendor, shelter management API, utility outage portal,
 * public status page, responder pager, weather feed, social platform).
 *
 * Here we simulate the call so the workflow engine can be exercised end to
 * end: latency, a structured receipt, and a deterministic failure path that
 * is driven by the `tool_status` table (a tool marked unavailable fails, which
 * is exactly the partial-failure condition the recovery path is built for).
 */

export type Impact = "critical" | "high" | "medium" | "low";

export interface ToolResult {
  ok: boolean;
  output: Record<string, unknown>;
  latencyMs: number;
}

export interface ToolDef {
  key: string;
  label: string;
  impact: Impact;
  /** Whether this tool's actions are consequential and need human approval. */
  consequential: boolean;
  description: string;
  run: (ctx: StepContext) => Promise<ToolResult>;
}

export interface StepContext {
  params: Record<string, unknown>;
  incident: {
    reference: string;
    title: string;
    zone?: string | null;
    location: string;
    populationAtRisk?: number | null;
    severity: number;
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function receipt(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}-${rand}`;
}

export const TOOLS: Record<string, ToolDef> = {
  weather_feed: {
    key: "weather_feed",
    label: "River & Weather Feed",
    impact: "low",
    consequential: false,
    description: "Pull live gauge readings and radar for the incident area.",
    run: async (ctx) => {
      await sleep(120);
      return {
        ok: true,
        latencyMs: 120,
        output: {
          source: "NOAA Hydromet + Local Radar",
          riverGauge: `${ctx.incident.zone ?? "MAIN"} gauge`,
          stageFt: (8 + Math.random() * 6).toFixed(1),
          rainfallMm1h: Math.round(20 + Math.random() * 60),
          trend: "rising",
        },
      };
    },
  },

  responder_pager: {
    key: "responder_pager",
    label: "Responder Pager",
    impact: "medium",
    consequential: false,
    description: "Page on-call response teams and log acknowledgement targets.",
    run: async (ctx) => {
      await sleep(180);
      const teams = (ctx.params.teams as string[]) ?? ["Fire", "EMS", "Public Works"];
      return {
        ok: true,
        latencyMs: 180,
        output: {
          pagedTeams: teams,
          ackTargetMin: 5,
          dispatchId: receipt("DSP"),
        },
      };
    },
  },

  shelter_activate: {
    key: "shelter_activate",
    label: "Shelter Management",
    impact: "medium",
    consequential: false,
    description: "Open and staff evacuation shelters, reserve capacity.",
    run: async (ctx) => {
      await sleep(260);
      const capacity = (ctx.params.capacity as number) ?? 250;
      return {
        ok: true,
        latencyMs: 260,
        output: {
          sheltersOpened: (ctx.params.shelters as string[]) ?? ["Lincoln HS", "Civic Center"],
          capacity,
          cotsDispatched: Math.min(capacity, 200),
          activationId: receipt("SHL"),
        },
      };
    },
  },

  status_page: {
    key: "status_page",
    label: "Public Status Page",
    impact: "low",
    consequential: false,
    description: "Update the public emergency status page and 311 recording.",
    run: async (ctx) => {
      await sleep(140);
      return {
        ok: true,
        latencyMs: 140,
        output: {
          pageId: "emergency.city.gov/status",
          lastUpdated: new Date().toISOString(),
          revision: receipt("ST"),
        },
      };
    },
  },

  evac_order: {
    key: "evac_order",
    label: "Evacuation Order Publisher",
    impact: "critical",
    consequential: true,
    description: "Publish a mandatory evacuation order to all public channels.",
    run: async (ctx) => {
      await sleep(300);
      const zones = (ctx.params.zones as string[]) ?? [ctx.incident.zone ?? "Zone A"];
      return {
        ok: true,
        latencyMs: 300,
        output: {
          orderId: receipt("EVO"),
          zones,
          publishedTo: ["emergency.city.gov", "Waze", "311", "Local TV/Roadcast"],
          effectiveAt: new Date().toISOString(),
          legalCited: "Mun. Code § 9.04 Emergency Powers",
        },
      };
    },
  },

  sms_broadcast: {
    key: "sms_broadcast",
    label: "Mass SMS Alert",
    impact: "high",
    consequential: true,
    description: "Send a geo-targeted emergency SMS to residents in the zone.",
    run: async (ctx) => {
      await sleep(340);
      const recipients =
        (ctx.params.recipients as number) ?? ctx.incident.populationAtRisk ?? 1200;
      return {
        ok: true,
        latencyMs: 340,
        output: {
          provider: "TitanSMS Gateway",
          messageId: receipt("SMS"),
          recipients,
          segments: Math.max(1, Math.round(recipients / 153)),
          deliveredEstimatePct: 97,
        },
      };
    },
  },

  utility_notify: {
    key: "utility_notify",
    label: "Utility Outage Portal",
    impact: "high",
    consequential: true,
    description: "Notify the utility to cut gas/power or pre-stage crews.",
    run: async (ctx) => {
      await sleep(280);
      return {
        ok: true,
        latencyMs: 280,
        output: {
          utility: (ctx.params.utility as string) ?? "Metro Gas & Electric",
          action: (ctx.params.action as string) ?? "Pre-stage crews",
          ticket: receipt("UTL"),
          etaMin: 30,
        },
      };
    },
  },

  social_media: {
    key: "social_media",
    label: "Social Advisory Post",
    impact: "medium",
    consequential: true,
    description: "Post an official advisory to municipal social channels.",
    run: async (ctx) => {
      await sleep(220);
      return {
        ok: true,
        latencyMs: 220,
        output: {
          platform: "City Emergency Accounts",
          postId: receipt("SOC"),
          reachEstimate: 85000,
        },
      };
    },
  },
};

export const TOOL_KEYS = Object.keys(TOOLS);

export function getTool(key: string): ToolDef | undefined {
  return TOOLS[key];
}
