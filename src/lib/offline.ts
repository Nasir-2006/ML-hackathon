"use client";

/**
 * Tiny offline action queue. When a device is offline (or a request fails),
 * consequential actions are persisted to localStorage and replayed
 * automatically when connectivity returns. This is the intermittent-
 * connectivity safety net for responders in the field.
 */

export interface QueuedAction {
  url: string;
  body: Record<string, string>;
  label: string;
  queuedAt: number;
}

const KEY = "sentinel_offline_queue";

export function getQueue(): QueuedAction[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as QueuedAction[];
  } catch {
    return [];
  }
}

export function addQueue(a: QueuedAction): number {
  const q = getQueue();
  q.push(a);
  localStorage.setItem(KEY, JSON.stringify(q));
  return q.length;
}

export function setQueue(q: QueuedAction[]) {
  localStorage.setItem(KEY, JSON.stringify(q));
}

export function clearQueue() {
  localStorage.removeItem(KEY);
}

export function getActor(): string {
  if (typeof window === "undefined") return "On-duty responder";
  return localStorage.getItem("sentinel_actor") || "On-duty responder";
}
