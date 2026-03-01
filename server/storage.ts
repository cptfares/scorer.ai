import { supabaseAdmin } from "./supabase";
import type {
  User, InsertUser, Phase, InsertPhase, Startup, InsertStartup,
  EvaluationCriteria, InsertEvaluationCriteria, JuryAssignment, InsertJuryAssignment,
  Evaluation, InsertEvaluation, DecisionLabel, InsertDecisionLabel
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>; // Added getAllUsers to interface

  // Phase management
  getPhases(): Promise<Phase[]>;
  getActivePhase(): Promise<Phase | undefined>;
  createPhase(phase: InsertPhase): Promise<Phase>;
  updatePhase(id: number, phase: Partial<InsertPhase>): Promise<Phase>;

  // Startup management
  getStartups(phaseId?: number): Promise<Startup[]>;
  getStartup(id: number): Promise<Startup | undefined>;
  getStartupByUserId(userId: number): Promise<Startup | undefined>;
  createStartup(startup: InsertStartup): Promise<Startup>;
  updateStartup(id: number, startup: Partial<Startup>): Promise<Startup>;
  deleteStartup(id: number): Promise<void>;

  // Evaluation criteria
  getEvaluationCriteria(): Promise<EvaluationCriteria[]>;
  createEvaluationCriteria(criteria: InsertEvaluationCriteria): Promise<EvaluationCriteria>;
  updateEvaluationCriteria(id: number, criteria: Partial<InsertEvaluationCriteria>): Promise<EvaluationCriteria>;

  // Jury assignments
  getJuryAssignments(juryId?: number, phaseId?: number): Promise<JuryAssignment[]>;
  createJuryAssignment(assignment: InsertJuryAssignment): Promise<JuryAssignment>;
  deleteJuryAssignment(id: number): Promise<void>;

  // Evaluations
  getEvaluations(phaseId?: number): Promise<Evaluation[]>;
  getEvaluation(juryId: number, startupId: number): Promise<Evaluation | undefined>;
  getEvaluationsByStartupId(startupId: number): Promise<Evaluation[]>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  updateEvaluation(id: number, evaluation: Partial<InsertEvaluation>): Promise<Evaluation>;

  // Decision labels
  getDecisionLabels(): Promise<DecisionLabel[]>;
  createDecisionLabel(label: InsertDecisionLabel): Promise<DecisionLabel>;

  // Analytics
  getStartupScores(phaseId?: number): Promise<any[]>;
  getEvaluationStats(phaseId?: number): Promise<any>;
}

// Helper to convert snake_case DB rows to camelCase for our app types
function toCamelCase(row: any): any {
  if (!row) return row;
  const result: any = {};
  for (const key of Object.keys(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = row[key];
  }
  return result;
}

function toSnakeCase(obj: any): any {
  if (!obj) return obj;
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

export class DatabaseStorage implements IStorage {
  // ── User management ──────────────────────────────────────

  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return undefined;
    return toCamelCase(data) as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    if (error || !data) return undefined;
    return toCamelCase(data) as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert(toSnakeCase(insertUser))
      .select()
      .single();
    if (error) throw error;
    return toCamelCase(data) as User;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .update(toSnakeCase(updateData))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toCamelCase(data) as User;
  }

  async deleteUser(id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("role", role);
    if (error) throw error;
    return (data || []).map(toCamelCase) as User[];
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*");
    if (error) throw error;
    return (data || []).map(toCamelCase) as User[];
  }

  // ── Phase management ─────────────────────────────────────

  async getPhases(): Promise<Phase[]> {
    const { data, error } = await supabaseAdmin
      .from("phases")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(toCamelCase) as Phase[];
  }

  async getActivePhase(): Promise<Phase | undefined> {
    const { data, error } = await supabaseAdmin
      .from("phases")
      .select("*")
      .eq("is_active", true)
      .single();
    if (error || !data) return undefined;
    return toCamelCase(data) as Phase;
  }

  async createPhase(insertPhase: InsertPhase): Promise<Phase> {
    const { data, error } = await supabaseAdmin
      .from("phases")
      .insert(toSnakeCase(insertPhase))
      .select()
      .single();
    if (error) throw error;
    return toCamelCase(data) as Phase;
  }

  async updatePhase(id: number, updateData: Partial<InsertPhase>): Promise<Phase> {
    const { data, error } = await supabaseAdmin
      .from("phases")
      .update(toSnakeCase(updateData))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toCamelCase(data) as Phase;
  }

  // ── Startup management ───────────────────────────────────

  async getStartups(phaseId?: number): Promise<Startup[]> {
    let query = supabaseAdmin.from("startups").select("*");
    if (phaseId) {
      query = query.eq("phase_id", phaseId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toCamelCase) as Startup[];
  }

  async getStartup(id: number): Promise<Startup | undefined> {
    const { data, error } = await supabaseAdmin
      .from("startups")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return undefined;
    return toCamelCase(data) as Startup;
  }

  async getStartupByUserId(userId: number): Promise<Startup | undefined> {
    const { data, error } = await supabaseAdmin
      .from("startups")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error || !data) return undefined;
    return toCamelCase(data) as Startup;
  }

  async createStartup(insertStartup: InsertStartup): Promise<Startup> {
    const { data, error } = await supabaseAdmin
      .from("startups")
      .insert(toSnakeCase(insertStartup))
      .select()
      .single();
    if (error) throw error;
    return toCamelCase(data) as Startup;
  }

  async updateStartup(id: number, updateData: Partial<Startup>): Promise<Startup> {
    const { data, error } = await supabaseAdmin
      .from("startups")
      .update(toSnakeCase(updateData))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toCamelCase(data) as Startup;
  }

  async deleteStartup(id: number): Promise<void> {
    // Delete related evaluations first
    const { error: evalError } = await supabaseAdmin
      .from("evaluations")
      .delete()
      .eq("startup_id", id);
    if (evalError) throw evalError;

    // Delete related jury assignments
    const { error: assignError } = await supabaseAdmin
      .from("jury_assignments")
      .delete()
      .eq("startup_id", id);
    if (assignError) throw assignError;

    // Finally delete the startup
    const { error } = await supabaseAdmin
      .from("startups")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  // ── Evaluation criteria ──────────────────────────────────

  async getEvaluationCriteria(): Promise<EvaluationCriteria[]> {
    const { data, error } = await supabaseAdmin
      .from("evaluation_criteria")
      .select("*")
      .eq("is_active", true);
    if (error) throw error;
    return (data || []).map(toCamelCase) as EvaluationCriteria[];
  }

  async createEvaluationCriteria(insertCriteria: InsertEvaluationCriteria): Promise<EvaluationCriteria> {
    const { data, error } = await supabaseAdmin
      .from("evaluation_criteria")
      .insert(toSnakeCase(insertCriteria))
      .select()
      .single();
    if (error) throw error;
    return toCamelCase(data) as EvaluationCriteria;
  }

  async updateEvaluationCriteria(id: number, updateData: Partial<InsertEvaluationCriteria>): Promise<EvaluationCriteria> {
    const { data, error } = await supabaseAdmin
      .from("evaluation_criteria")
      .update(toSnakeCase(updateData))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toCamelCase(data) as EvaluationCriteria;
  }

  // ── Jury assignments ─────────────────────────────────────

  async getJuryAssignments(juryId?: number, phaseId?: number): Promise<JuryAssignment[]> {
    let query = supabaseAdmin.from("jury_assignments").select("*");
    if (juryId) query = query.eq("jury_id", juryId);
    if (phaseId) query = query.eq("phase_id", phaseId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toCamelCase) as JuryAssignment[];
  }

  async createJuryAssignment(insertAssignment: InsertJuryAssignment): Promise<JuryAssignment> {
    const { data, error } = await supabaseAdmin
      .from("jury_assignments")
      .insert(toSnakeCase(insertAssignment))
      .select()
      .single();
    if (error) throw error;
    return toCamelCase(data) as JuryAssignment;
  }

  async deleteJuryAssignment(id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from("jury_assignments")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  // ── Evaluations ──────────────────────────────────────────

  async getEvaluations(phaseId?: number): Promise<Evaluation[]> {
    let query = supabaseAdmin.from("evaluations").select("*");
    if (phaseId) query = query.eq("phase_id", phaseId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toCamelCase) as Evaluation[];
  }

  async getEvaluation(juryId: number, startupId: number): Promise<Evaluation | undefined> {
    const { data, error } = await supabaseAdmin
      .from("evaluations")
      .select("*")
      .eq("jury_id", juryId)
      .eq("startup_id", startupId)
      .single();
    if (error || !data) return undefined;
    return toCamelCase(data) as Evaluation;
  }

  async getEvaluationsByStartupId(startupId: number): Promise<Evaluation[]> {
    const { data, error } = await supabaseAdmin
      .from("evaluations")
      .select("*")
      .eq("startup_id", startupId);
    if (error) throw error;
    return (data || []).map(toCamelCase) as Evaluation[];
  }

  async createEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    const { data, error } = await supabaseAdmin
      .from("evaluations")
      .insert(toSnakeCase(insertEvaluation))
      .select()
      .single();
    if (error) throw error;
    return toCamelCase(data) as Evaluation;
  }

  async updateEvaluation(id: number, updateData: Partial<InsertEvaluation>): Promise<Evaluation> {
    const { data, error } = await supabaseAdmin
      .from("evaluations")
      .update({ ...toSnakeCase(updateData), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toCamelCase(data) as Evaluation;
  }

  // ── Decision labels ──────────────────────────────────────

  async getDecisionLabels(): Promise<DecisionLabel[]> {
    const { data, error } = await supabaseAdmin
      .from("decision_labels")
      .select("*");
    if (error) throw error;
    return (data || []).map(toCamelCase) as DecisionLabel[];
  }

  async createDecisionLabel(insertLabel: InsertDecisionLabel): Promise<DecisionLabel> {
    const { data, error } = await supabaseAdmin
      .from("decision_labels")
      .insert(toSnakeCase(insertLabel))
      .select()
      .single();
    if (error) throw error;
    return toCamelCase(data) as DecisionLabel;
  }

  // ── Analytics (computed server-side) ─────────────────────

  async getStartupScores(phaseId?: number): Promise<any[]> {
    // Fetch startups
    let startupQuery = supabaseAdmin.from("startups").select("*");
    if (phaseId) startupQuery = startupQuery.eq("phase_id", phaseId);
    const { data: startups, error: sErr } = await startupQuery;
    if (sErr) throw sErr;

    // Fetch evaluations
    let evalQuery = supabaseAdmin.from("evaluations").select("*");
    if (phaseId) evalQuery = evalQuery.eq("phase_id", phaseId);
    const { data: evaluations, error: eErr } = await evalQuery;
    if (eErr) throw eErr;

    // Compute scores per startup
    return (startups || []).map((s: any) => {
      const startupEvals = (evaluations || []).filter((e: any) => e.startupId === s.id || e.startup_id === s.id);
      const scores = startupEvals
        .map((e: any) => {
          if (!e.scores || typeof e.scores !== 'object') return null;
          const values = Object.values(e.scores).map(v => typeof v === 'number' ? v : parseFloat(v as string)).filter((v): v is number => !isNaN(v));
          return values.length > 0 ? (values.reduce((a: number, b: number) => a + b, 0) / values.length) : null;
        })
        .filter((v: number | null): v is number => v !== null);

      return {
        startupId: s.id,
        startupName: s.name,
        category: s.category,
        avgScore: scores.length > 0 ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null,
        evaluationCount: startupEvals.length,
        decision: startupEvals.length > 0 ? startupEvals[0].decision : null,
      };
    });
  }

  async getEvaluationStats(phaseId?: number): Promise<any> {
    // Fetch startups
    let startupQuery = supabaseAdmin.from("startups").select("id");
    if (phaseId) startupQuery = startupQuery.eq("phase_id", phaseId);
    const { data: startups, error: sErr } = await startupQuery;
    if (sErr) throw sErr;

    // Fetch evaluations
    let evalQuery = supabaseAdmin.from("evaluations").select("*");
    if (phaseId) evalQuery = evalQuery.eq("phase_id", phaseId);
    const { data: evaluations, error: eErr } = await evalQuery;
    if (eErr) throw eErr;

    const completedEvals = (evaluations || []).filter((e: any) => e.is_completed);
    const allScores = (evaluations || [])
      .map((e: any) => {
        if (!e.scores || typeof e.scores !== 'object') return null;
        const values = Object.values(e.scores).map(v => typeof v === 'number' ? v : parseFloat(v as string)).filter(v => !isNaN(v));
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
      })
      .filter((v: any) => v !== null);

    return {
      totalStartups: (startups || []).length,
      totalEvaluations: (evaluations || []).length,
      completedEvaluations: completedEvals.length,
      avgScore: allScores.length > 0
        ? allScores.filter((v): v is number => v !== null).reduce((a: number, b: number) => a + b, 0) / allScores.length
        : null,
    };
  }
}

export const storage = new DatabaseStorage();
