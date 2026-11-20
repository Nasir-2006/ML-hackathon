import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  varchar,
  numeric,
  index,
} from "drizzle-orm/pg-core";

/**
 * A fast-moving incident handled by the municipal emergency office.
 */
export const incidents = pgTable(
  "incidents",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    title: text("title").notNull(),
    type: varchar("type", { length: 64 }).notNull(), // flood | fire | severe_weather
    severity: integer("severity").notNull().default(3), // 1 (low) .. 5 (catastrophic)
    status: varchar("status", { length: 24 }).notNull().default("active"), // active | contained | resolved
    location: text("location").notNull(),
    zone: varchar("zone", { length: 64 }),
    populationAtRisk: integer("population_at_risk"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (t) => [index("incidents_status_idx").on(t.status)],
);

/**
 * A coordinated multi-step response procedure launched for an incident.
 * Replaces the same work being done manually across disconnected tools.
 */
export const workflows = pgTable(
  "workflows",
  {
    id: serial("id").primaryKey(),
    incidentId: integer("incident_id")
      .notNull()
      .references(() => incidents.id, { onDelete: "cascade" }),
    playbook: varchar("playbook", { length: 64 }).notNull(),
    name: text("name").notNull(),
    status: varchar("status", { length: 24 }).notNull().default("draft"),
    // draft | running | awaiting_approval | needs_recovery | completed | aborted
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("workflows_incident_idx").on(t.incidentId)],
);

/**
 * A single tool action inside a workflow. May require human approval
 * before execution and produces an evidence record when it is a
 * high-impact output.
 */
export const workflowSteps = pgTable(
  "workflow_steps",
  {
    id: serial("id").primaryKey(),
    workflowId: integer("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    tool: varchar("tool", { length: 48 }).notNull(),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    approvalStatus: varchar("approval_status", { length: 24 })
      .notNull()
      .default("not_required"), // not_required | requested | approved | rejected
    approvedBy: varchar("approved_by", { length: 120 }),
    approvedAt: timestamp("approved_at"),
    approvalNote: text("approval_note"),
    params: jsonb("params").notNull().default({}),
    status: varchar("status", { length: 24 }).notNull().default("pending"),
    // pending | waiting | executing | succeeded | failed | skipped
    result: jsonb("result").notNull().default({}),
    errorMessage: text("error_message"),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastAttemptAt: timestamp("last_attempt_at"),
    executedAt: timestamp("executed_at"),
    evidenceId: integer("evidence_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("workflow_steps_workflow_idx").on(t.workflowId)],
);

/**
 * Tamper-evident record for every high-impact output (consequential action).
 * Captures what was done, by whom, with whose approval, and the tool receipt.
 */
export const evidence = pgTable(
  "evidence",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 32 }).notNull().unique(),
    stepId: integer("step_id")
      .notNull()
      .references(() => workflowSteps.id, { onDelete: "cascade" }),
    workflowId: integer("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    incidentId: integer("incident_id")
      .notNull()
      .references(() => incidents.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    actor: varchar("actor", { length: 120 }),
    approver: varchar("approver", { length: 120 }),
    tool: varchar("tool", { length: 48 }).notNull(),
    impact: varchar("impact", { length: 24 }).notNull().default("high"),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("evidence_incident_idx").on(t.incidentId)],
);

/**
 * Append-only audit trail of every workflow decision and tool call.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    incidentId: integer("incident_id"),
    workflowId: integer("workflow_id"),
    stepId: integer("step_id"),
    actor: varchar("actor", { length: 120 }),
    action: varchar("action", { length: 64 }).notNull(),
    detail: jsonb("detail").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("audit_log_incident_idx").on(t.incidentId)],
);

/**
 * Live availability of the mocked municipal tools. Lets responders simulate
 * a partial tool outage to exercise the recovery path.
 */
export const toolStatus = pgTable("tool_status", {
  tool: varchar("tool", { length: 48 }).notNull().primaryKey(),
  available: boolean("available").notNull().default(true),
  note: text("note"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * The documented manual baseline the automated workflow is measured against.
 */
export const baseline = pgTable("baseline", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 120 }).notNull(),
  manualSteps: integer("manual_steps").notNull(),
  manualTools: integer("manual_tools").notNull(),
  manualMinutes: integer("manual_minutes").notNull(),
  manualErrorsPerIncident: numeric("manual_errors_per_incident", {
    precision: 4,
    scale: 2,
  }).notNull(),
  source: text("source").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Incident = typeof incidents.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
export type ToolStatusRow = typeof toolStatus.$inferSelect;
export type Baseline = typeof baseline.$inferSelect;
