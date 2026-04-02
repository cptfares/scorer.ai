import { z } from "zod";

// ── Type definitions (matching database tables) ──────────────

export type User = {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  phoneNumber: string | null;
  bio: string | null;
  isActive: boolean | null;
  createdAt: string | null;
};

export type Cohort = {
  id: number;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean | null;
  createdAt: string | null;
};

export type Round = {
  id: number;
  cohortId: number;
  name: string;
  description: string | null;
  order: number | null;
  isActive: boolean | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
};

export type RoundStartup = {
  id: number;
  roundId: number;
  startupId: number;
  createdAt: string | null;
};

export type RoundCriteria = {
  id: number;
  roundId: number;
  name: string;
  description: string | null;
  type: "scale" | "binary" | "text";
  scaleMin: number | null;
  scaleMax: number | null;
  order: number | null;
  isActive: boolean | null;
  weight: number | null;
};

export type Phase = {
  id: number;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean | null;
  createdAt: string | null;
};

export type Startup = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  founded: string | null;
  teamSize: string | null;
  stage: string | null;
  fundingSeek: string | null;
  website: string | null;
  logoUrl: string | null;
  phaseId: number | null;
  cohortId: number | null;
  userId: number | null;
  finalDecision: string | null;
  createdAt: string | null;
  team: Array<{ name: string; role: string }> | null;
  revenueModel: string | null;
  onePagerLink: string | null;
};

export type EvaluationCriteria = {
  id: number;
  name: string;
  description: string | null;
  order: number | null;
  isActive: boolean | null;
};

export type JuryAssignment = {
  id: number;
  juryId: number | null;
  startupId: number | null;
  phaseId: number | null;
  roundId: number | null;
  createdAt: string | null;
};

export type Evaluation = {
  id: number;
  juryId: number | null;
  startupId: number | null;
  phaseId: number | null;
  roundId: number | null;
  scores: any;
  comments: string | null;
  decision: string | null;
  isCompleted: boolean | null;
  submittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DecisionLabel = {
  id: number;
  value: string;
  label: string;
  description: string | null;
};

// ── Insert schemas (Zod validation, used by routes) ──────────

export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  name: z.string(),
  role: z.string().default("jury"),
  phoneNumber: z.string().optional(),
  bio: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const insertCohortSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional().default(true),
});

export const insertRoundSchema = z.object({
  cohortId: z.number(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  order: z.number().optional().default(1),
  isActive: z.boolean().optional().default(true),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const insertRoundCriteriaSchema = z.object({
  roundId: z.number(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["scale", "binary", "text"]).default("scale"),
  scaleMin: z.number().optional().default(1),
  scaleMax: z.number().optional().default(5),
  order: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
  weight: z.number().optional().default(1),
});

export const insertPhaseSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional().default(true),
});

export const insertStartupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  category: z.string().min(1, "Category is required"),
  founded: z.string().optional().nullable(),
  teamSize: z.coerce.string().optional().nullable(),
  stage: z.string().optional().nullable(),
  fundingSeek: z.coerce.string().optional().nullable(),
  website: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  phaseId: z.number().optional().nullable(),
  cohortId: z.number().optional().nullable(),
  userId: z.number().optional().nullable(),
  finalDecision: z.string().optional().nullable(),
  team: z.array(z.object({ name: z.string(), role: z.string().optional().default("") })).optional().nullable(),
  revenueModel: z.string().optional().nullable(),
  onePagerLink: z.string().optional().nullable(),
});

export const insertEvaluationCriteriaSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  order: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const insertJuryAssignmentSchema = z.object({
  juryId: z.number(),
  startupId: z.number(),
  phaseId: z.number().optional().nullable(),
  roundId: z.number().optional().nullable(),
});

export const insertEvaluationSchema = z.object({
  juryId: z.number(),
  startupId: z.number(),
  phaseId: z.number().optional().nullable(),
  roundId: z.number().optional().nullable(),
  scores: z.any().optional(),
  comments: z.string().optional(),
  decision: z.string().optional(),
  isCompleted: z.boolean().optional().default(false),
  submittedAt: z.coerce.date().optional(),
});

export const insertDecisionLabelSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

// ── Insert types (inferred from Zod schemas) ─────────────────

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCohort = z.infer<typeof insertCohortSchema>;
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type InsertRoundCriteria = z.infer<typeof insertRoundCriteriaSchema>;
export type InsertPhase = z.infer<typeof insertPhaseSchema>;
export type InsertStartup = z.infer<typeof insertStartupSchema>;
export type InsertEvaluationCriteria = z.infer<typeof insertEvaluationCriteriaSchema>;
export type InsertJuryAssignment = z.infer<typeof insertJuryAssignmentSchema>;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type InsertDecisionLabel = z.infer<typeof insertDecisionLabelSchema>;
