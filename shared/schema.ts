import { z } from "zod";

// ── Type definitions (matching database tables) ──────────────

export type User = {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  isActive: boolean | null;
  createdAt: string | null;
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
  finalDecision: string | null;
  createdAt: string | null;
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
  createdAt: string | null;
};

export type Evaluation = {
  id: number;
  juryId: number | null;
  startupId: number | null;
  phaseId: number | null;
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
  isActive: z.boolean().optional().default(true),
});

export const insertPhaseSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional().default(true),
});

export const insertStartupSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.string(),
  founded: z.string().optional(),
  teamSize: z.string().optional(),
  stage: z.string().optional(),
  fundingSeek: z.string().optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  phaseId: z.number().optional(),
  finalDecision: z.string().optional(),
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
  phaseId: z.number(),
});

export const insertEvaluationSchema = z.object({
  juryId: z.number(),
  startupId: z.number(),
  phaseId: z.number(),
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
export type InsertPhase = z.infer<typeof insertPhaseSchema>;
export type InsertStartup = z.infer<typeof insertStartupSchema>;
export type InsertEvaluationCriteria = z.infer<typeof insertEvaluationCriteriaSchema>;
export type InsertJuryAssignment = z.infer<typeof insertJuryAssignmentSchema>;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type InsertDecisionLabel = z.infer<typeof insertDecisionLabelSchema>;
