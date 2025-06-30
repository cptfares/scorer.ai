import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (admins and jury members)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("jury"), // 'admin' or 'jury'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Phases table (cohorts/evaluation phases)
export const phases = pgTable("phases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Startups table
export const startups = pgTable("startups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  founded: text("founded"),
  teamSize: text("team_size"),
  stage: text("stage"),
  fundingSeek: text("funding_seek"),
  website: text("website"),
  logoUrl: text("logo_url"),
  phaseId: integer("phase_id").references(() => phases.id),
  finalDecision: text("final_decision"), // 'accept', 'reject', null for pending
  createdAt: timestamp("created_at").defaultNow(),
});

// Evaluation criteria (customizable)
export const evaluationCriteria = pgTable("evaluation_criteria", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
});

// Jury assignments (which jury members evaluate which startups)
export const juryAssignments = pgTable("jury_assignments", {
  id: serial("id").primaryKey(),
  juryId: integer("jury_id").references(() => users.id),
  startupId: integer("startup_id").references(() => startups.id),
  phaseId: integer("phase_id").references(() => phases.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Evaluations table (main evaluation records)
export const evaluations = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  juryId: integer("jury_id").references(() => users.id),
  startupId: integer("startup_id").references(() => startups.id),
  phaseId: integer("phase_id").references(() => phases.id),
  scores: jsonb("scores"), // JSON object with criteria scores
  comments: text("comments"),
  decision: text("decision"), // 'yes', 'maybe', 'no'
  isCompleted: boolean("is_completed").default(false),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Decision labels (customizable Yes/Maybe/No labels)
export const decisionLabels = pgTable("decision_labels", {
  id: serial("id").primaryKey(),
  value: text("value").notNull(), // 'yes', 'maybe', 'no'
  label: text("label").notNull(), // Display label
  description: text("description"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  juryAssignments: many(juryAssignments),
  evaluations: many(evaluations),
}));

export const phasesRelations = relations(phases, ({ many }) => ({
  startups: many(startups),
  juryAssignments: many(juryAssignments),
  evaluations: many(evaluations),
}));

export const startupsRelations = relations(startups, ({ one, many }) => ({
  phase: one(phases, {
    fields: [startups.phaseId],
    references: [phases.id],
  }),
  juryAssignments: many(juryAssignments),
  evaluations: many(evaluations),
}));

export const juryAssignmentsRelations = relations(juryAssignments, ({ one }) => ({
  jury: one(users, {
    fields: [juryAssignments.juryId],
    references: [users.id],
  }),
  startup: one(startups, {
    fields: [juryAssignments.startupId],
    references: [startups.id],
  }),
  phase: one(phases, {
    fields: [juryAssignments.phaseId],
    references: [phases.id],
  }),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  jury: one(users, {
    fields: [evaluations.juryId],
    references: [users.id],
  }),
  startup: one(startups, {
    fields: [evaluations.startupId],
    references: [startups.id],
  }),
  phase: one(phases, {
    fields: [evaluations.phaseId],
    references: [phases.id],
  }),
}));

export const evaluationCriteriaRelations = relations(evaluationCriteria, ({ many }) => ({}));

export const decisionLabelsRelations = relations(decisionLabels, ({ many }) => ({}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPhaseSchema = createInsertSchema(phases).omit({
  id: true,
  createdAt: true,
});

export const insertStartupSchema = createInsertSchema(startups).omit({
  id: true,
  createdAt: true,
});

export const insertEvaluationCriteriaSchema = createInsertSchema(evaluationCriteria).omit({
  id: true,
});

export const insertJuryAssignmentSchema = createInsertSchema(juryAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDecisionLabelSchema = createInsertSchema(decisionLabels).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Phase = typeof phases.$inferSelect;
export type InsertPhase = z.infer<typeof insertPhaseSchema>;

export type Startup = typeof startups.$inferSelect;
export type InsertStartup = z.infer<typeof insertStartupSchema>;

export type EvaluationCriteria = typeof evaluationCriteria.$inferSelect;
export type InsertEvaluationCriteria = z.infer<typeof insertEvaluationCriteriaSchema>;

export type JuryAssignment = typeof juryAssignments.$inferSelect;
export type InsertJuryAssignment = z.infer<typeof insertJuryAssignmentSchema>;

export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;

export type DecisionLabel = typeof decisionLabels.$inferSelect;
export type InsertDecisionLabel = z.infer<typeof insertDecisionLabelSchema>;
