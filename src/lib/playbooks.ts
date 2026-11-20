/**
 * Response playbooks. Each is a coordinated sequence of tool actions that,
 * today, staff perform manually across disconnected systems. Launching a
 * playbook turns that scattered work into one dependable, resumable procedure.
 */

export interface PlaybookStep {
  name: string;
  tool: string;
  requiresApproval: boolean;
  /** Default params; merged with live incident context at execution time. */
  params?: Record<string, unknown>;
}

export interface Playbook {
  slug: string;
  name: string;
  description: string;
  /** Consequential steps that need human approval before they run. */
  steps: PlaybookStep[];
}

export const PLAYBOOKS: Playbook[] = [
  {
    slug: "flood_response",
    name: "Flash Flood Response",
    description:
      "Coordinate gauges, responders, shelters, evacuation, alerts and utilities for a rising-water incident.",
    steps: [
      { name: "Pull live river & weather feed", tool: "weather_feed", requiresApproval: false },
      { name: "Page responder teams", tool: "responder_pager", requiresApproval: false,
        params: { teams: ["Fire", "EMS", "Public Works", "Swift-Water Rescue"] } },
      { name: "Activate evacuation shelters", tool: "shelter_activate", requiresApproval: false,
        params: { shelters: ["Lincoln HS", "Civic Center"], capacity: 400 } },
      { name: "Publish mandatory evacuation order", tool: "evac_order", requiresApproval: true,
        params: { zones: ["Zone A", "Zone B"] } },
      { name: "Mass SMS to residents in zone", tool: "sms_broadcast", requiresApproval: true,
        params: { recipients: 3200 } },
      { name: "Notify utility to cut power near flood line", tool: "utility_notify", requiresApproval: true,
        params: { utility: "Metro Gas & Electric", action: "Cut power, Stage crews" } },
      { name: "Update public status page", tool: "status_page", requiresApproval: false },
      { name: "Post social media advisory", tool: "social_media", requiresApproval: true },
    ],
  },
  {
    slug: "fire_response",
    name: "Wildfire / Structure Fire",
    description:
      "Mobilize responders, open shelters, order evacuation and alert the public for a fast-moving fire.",
    steps: [
      { name: "Page responder teams", tool: "responder_pager", requiresApproval: false,
        params: { teams: ["Fire", "EMS", "Air Operations"] } },
      { name: "Activate evacuation shelters", tool: "shelter_activate", requiresApproval: false,
        params: { shelters: ["Eastside MS"], capacity: 300 } },
      { name: "Publish mandatory evacuation order", tool: "evac_order", requiresApproval: true,
        params: { zones: ["Ridge District"] } },
      { name: "Mass SMS to residents in zone", tool: "sms_broadcast", requiresApproval: true,
        params: { recipients: 2100 } },
      { name: "Notify utility to shut gas mains", tool: "utility_notify", requiresApproval: true,
        params: { utility: "Metro Gas & Electric", action: "Shut gas mains" } },
      { name: "Update public status page", tool: "status_page", requiresApproval: false },
      { name: "Post social media advisory", tool: "social_media", requiresApproval: true },
    ],
  },
  {
    slug: "severe_weather",
    name: "Severe Thunderstorm / Tornado",
    description:
      "Warn the public, open shelters and keep the status page current during a severe-weather cell.",
    steps: [
      { name: "Pull live weather feed", tool: "weather_feed", requiresApproval: false },
      { name: "Mass SMS warning to residents", tool: "sms_broadcast", requiresApproval: true,
        params: { recipients: 5400 } },
      { name: "Activate evacuation shelters", tool: "shelter_activate", requiresApproval: false,
        params: { shelters: ["Civic Center"], capacity: 250 } },
      { name: "Update public status page", tool: "status_page", requiresApproval: false },
      { name: "Post social media advisory", tool: "social_media", requiresApproval: true },
    ],
  },
];

export function getPlaybook(slug: string): Playbook | undefined {
  return PLAYBOOKS.find((p) => p.slug === slug);
}
