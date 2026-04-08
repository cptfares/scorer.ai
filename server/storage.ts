import { supabaseAdmin } from "./supabase";
import type {
  User, InsertUser, Phase, InsertPhase, Startup, InsertStartup,
  EvaluationCriteria, InsertEvaluationCriteria, JuryAssignment, InsertJuryAssignment,
  Evaluation, InsertEvaluation, DecisionLabel, InsertDecisionLabel,
  Cohort, InsertCohort, Round, InsertRound, RoundCriteria, InsertRoundCriteria, RoundStartup
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // Cohort management
  getCohorts(): Promise<Cohort[]>;
  getCohort(id: number): Promise<Cohort | undefined>;
  createCohort(cohort: InsertCohort): Promise<Cohort>;
  updateCohort(id: number, cohort: Partial<InsertCohort>): Promise<Cohort>;
  deleteCohort(id: number): Promise<void>;

  // Round management
  getRounds(cohortId: number): Promise<Round[]>;
  getRound(id: number): Promise<Round | undefined>;
  createRound(round: InsertRound): Promise<Round>;
  updateRound(id: number, round: Partial<InsertRound>): Promise<Round>;
  deleteRound(id: number): Promise<void>;

  // Round criteria management
  getRoundCriteria(roundId: number): Promise<RoundCriteria[]>;
  createRoundCriteria(criteria: InsertRoundCriteria): Promise<RoundCriteria>;
  updateRoundCriteria(id: number, criteria: Partial<InsertRoundCriteria>): Promise<RoundCriteria>;
  deleteRoundCriteria(id: number): Promise<void>;

  // Round startups (advancing startups between rounds)
  getRoundStartups(roundId: number): Promise<Startup[]>;
  addStartupToRound(roundId: number, startupId: number): Promise<RoundStartup>;
  removeStartupFromRound(roundId: number, startupId: number): Promise<void>;

  // Phase management (legacy)
  getPhases(): Promise<Phase[]>;
  getActivePhase(): Promise<Phase | undefined>;
  createPhase(phase: InsertPhase): Promise<Phase>;
  updatePhase(id: number, phase: Partial<InsertPhase>): Promise<Phase>;

  // Startup management
  getStartups(phaseId?: number, cohortId?: number): Promise<Startup[]>;
  getStartup(id: number): Promise<Startup | undefined>;
  getStartupByUserId(userId: number): Promise<Startup | undefined>;
  createStartup(startup: InsertStartup): Promise<Startup>;
  updateStartup(id: number, startup: Partial<Startup>): Promise<Startup>;
  deleteStartup(id: number): Promise<void>;

  // Evaluation criteria (legacy global)
  getEvaluationCriteria(): Promise<EvaluationCriteria[]>;
  createEvaluationCriteria(criteria: InsertEvaluationCriteria): Promise<EvaluationCriteria>;
  updateEvaluationCriteria(id: number, criteria: Partial<InsertEvaluationCriteria>): Promise<EvaluationCriteria>;

  // Jury assignments
  getJuryAssignments(juryId?: number, phaseId?: number, roundId?: number): Promise<JuryAssignment[]>;
  createJuryAssignment(assignment: InsertJuryAssignment): Promise<JuryAssignment>;
  deleteJuryAssignment(id: number): Promise<void>;

  // Evaluations
  getEvaluations(phaseId?: number, roundId?: number): Promise<Evaluation[]>;
  getEvaluation(juryId: number, startupId: number, roundId?: number): Promise<Evaluation | undefined>;
  getEvaluationsByStartupId(startupId: number): Promise<Evaluation[]>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  upsertEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  updateEvaluation(id: number, evaluation: Partial<InsertEvaluation>): Promise<Evaluation>;
  getDuplicateEvaluations(): Promise<{ juryId: number; startupId: number; roundId: number | null; count: number; ids: number[] }[]>;
  deduplicateEvaluations(): Promise<{ removed: number }>;

  // Decision labels
  getDecisionLabels(): Promise<DecisionLabel[]>;
  createDecisionLabel(label: InsertDecisionLabel): Promise<DecisionLabel>;

  // Analytics
  getStartupScores(phaseId?: number, roundId?: number): Promise<any[]>;
  getEvaluationStats(phaseId?: number, roundId?: number): Promise<any>;
}

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
      .from("users").select("*").eq("id", id).single();
    if (error || !data) return undefined;
    return toCamelCase(data) as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabaseAdmin
      .from("users").select("*").eq("email", email).single();
    if (error || !data) return undefined;
    return toCamelCase(data) as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from("users").insert(toSnakeCase(insertUser)).select().single();
    if (error) throw error;
    return toCamelCase(data) as User;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from("users").update(toSnakeCase(updateData)).eq("id", id).select().single();
    if (error) throw error;
    return toCamelCase(data) as User;
  }

  async deleteUser(id: number): Promise<void> {
    const { error } = await supabaseAdmin.from("users").delete().eq("id", id);
    if (error) throw error;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const { data, error } = await supabaseAdmin
      .from("users").select("*").eq("role", role);
    if (error) throw error;
    return (data || []).map(toCamelCase) as User[];
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabaseAdmin.from("users").select("*");
    if (error) throw error;
    return (data || []).map(toCamelCase) as User[];
  }

  // ── Cohort management ────────────────────────────────────

  async getCohorts(): Promise<Cohort[]> {
    const { data, error } = await supabaseAdmin
      .from("cohorts").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(toCamelCase) as Cohort[];
  }

  async getCohort(id: number): Promise<Cohort | undefined> {
    const { data, error } = await supabaseAdmin
      .from("cohorts").select("*").eq("id", id).single();
    if (error || !data) return undefined;
    return toCamelCase(data) as Cohort;
  }

  async createCohort(insertCohort: InsertCohort): Promise<Cohort> {
    const { data, error } = await supabaseAdmin
      .from("cohorts").insert(toSnakeCase(insertCohort)).select().single();
    if (error) throw error;
    return toCamelCase(data) as Cohort;
  }

  async updateCohort(id: number, updateData: Partial<InsertCohort>): Promise<Cohort> {
    const { data, error } = await supabaseAdmin
      .from("cohorts").update(toSnakeCase(updateData)).eq("id", id).select().single();
    if (error) throw error;
    return toCamelCase(data) as Cohort;
  }

  async deleteCohort(id: number): Promise<void> {
    // Delete all rounds (and their dependents) first
    const { data: rounds } = await supabaseAdmin.from("rounds").select("id").eq("cohort_id", id);
    for (const round of rounds || []) {
      await this.deleteRound(round.id);
    }
    // Detach startups from this cohort instead of deleting them
    await supabaseAdmin.from("startups").update({ cohort_id: null }).eq("cohort_id", id);
    const { error } = await supabaseAdmin.from("cohorts").delete().eq("id", id);
    if (error) throw error;
  }

  // ── Round management ─────────────────────────────────────

  async getRounds(cohortId: number): Promise<Round[]> {
    const { data, error } = await supabaseAdmin
      .from("rounds").select("*").eq("cohort_id", cohortId).order("order", { ascending: true });
    if (error) throw error;
    return (data || []).map(toCamelCase) as Round[];
  }

  async getRound(id: number): Promise<Round | undefined> {
    const { data, error } = await supabaseAdmin
      .from("rounds").select("*").eq("id", id).single();
    if (error || !data) return undefined;
    return toCamelCase(data) as Round;
  }

  async createRound(insertRound: InsertRound): Promise<Round> {
    const { data, error } = await supabaseAdmin
      .from("rounds").insert(toSnakeCase(insertRound)).select().single();
    if (error) throw error;
    return toCamelCase(data) as Round;
  }

  async updateRound(id: number, updateData: Partial<InsertRound>): Promise<Round> {
    const { data, error } = await supabaseAdmin
      .from("rounds").update(toSnakeCase(updateData)).eq("id", id).select().single();
    if (error) throw error;
    return toCamelCase(data) as Round;
  }

  async deleteRound(id: number): Promise<void> {
    // Delete dependent records first to avoid FK violations
    await supabaseAdmin.from("evaluations").delete().eq("round_id", id);
    await supabaseAdmin.from("jury_assignments").delete().eq("round_id", id);
    await supabaseAdmin.from("round_startups").delete().eq("round_id", id);
    await supabaseAdmin.from("round_criteria").delete().eq("round_id", id);
    const { error } = await supabaseAdmin.from("rounds").delete().eq("id", id);
    if (error) throw error;
  }

  // ── Round criteria ───────────────────────────────────────

  async getRoundCriteria(roundId: number): Promise<RoundCriteria[]> {
    const { data, error } = await supabaseAdmin
      .from("round_criteria").select("*").eq("round_id", roundId).order("order", { ascending: true });
    if (error) throw error;
    return (data || []).map(toCamelCase) as RoundCriteria[];
  }

  async createRoundCriteria(insertCriteria: InsertRoundCriteria): Promise<RoundCriteria> {
    const { data, error } = await supabaseAdmin
      .from("round_criteria").insert(toSnakeCase(insertCriteria)).select().single();
    if (error) throw error;
    return toCamelCase(data) as RoundCriteria;
  }

  async updateRoundCriteria(id: number, updateData: Partial<InsertRoundCriteria>): Promise<RoundCriteria> {
    const { data, error } = await supabaseAdmin
      .from("round_criteria").update(toSnakeCase(updateData)).eq("id", id).select().single();
    if (error) throw error;
    return toCamelCase(data) as RoundCriteria;
  }

  async deleteRoundCriteria(id: number): Promise<void> {
    const { error } = await supabaseAdmin.from("round_criteria").delete().eq("id", id);
    if (error) throw error;
  }

  // ── Round startups ───────────────────────────────────────

  async getRoundStartups(roundId: number): Promise<Startup[]> {
    const { data, error } = await supabaseAdmin
      .from("round_startups").select("startup_id").eq("round_id", roundId);
    if (error) throw error;
    if (!data || data.length === 0) return [];
    const startupIds = data.map((r: any) => r.startup_id);
    const { data: startups, error: sErr } = await supabaseAdmin
      .from("startups").select("*").in("id", startupIds);
    if (sErr) throw sErr;
    return (startups || []).map(toCamelCase) as Startup[];
  }

  async addStartupToRound(roundId: number, startupId: number): Promise<RoundStartup> {
    const { data, error } = await supabaseAdmin
      .from("round_startups").insert({ round_id: roundId, startup_id: startupId }).select().single();
    if (error) throw error;
    return toCamelCase(data) as RoundStartup;
  }

  async removeStartupFromRound(roundId: number, startupId: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from("round_startups").delete().eq("round_id", roundId).eq("startup_id", startupId);
    if (error) throw error;
  }

  // ── Phase management (legacy) ────────────────────────────

  async getPhases(): Promise<Phase[]> {
    const { data, error } = await supabaseAdmin
      .from("phases").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(toCamelCase) as Phase[];
  }

  async getActivePhase(): Promise<Phase | undefined> {
    const { data, error } = await supabaseAdmin
      .from("phases").select("*").eq("is_active", true).single();
    if (error || !data) return undefined;
    return toCamelCase(data) as Phase;
  }

  async createPhase(insertPhase: InsertPhase): Promise<Phase> {
    const { data, error } = await supabaseAdmin
      .from("phases").insert(toSnakeCase(insertPhase)).select().single();
    if (error) throw error;
    return toCamelCase(data) as Phase;
  }

  async updatePhase(id: number, updateData: Partial<InsertPhase>): Promise<Phase> {
    const { data, error } = await supabaseAdmin
      .from("phases").update(toSnakeCase(updateData)).eq("id", id).select().single();
    if (error) throw error;
    return toCamelCase(data) as Phase;
  }

  // ── Startup management ───────────────────────────────────

  async getStartups(phaseId?: number, cohortId?: number): Promise<Startup[]> {
    let query = supabaseAdmin.from("startups").select("*");
    if (phaseId) query = query.eq("phase_id", phaseId);
    if (cohortId) query = query.eq("cohort_id", cohortId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toCamelCase) as Startup[];
  }

  async getStartup(id: number): Promise<Startup | undefined> {
    const { data, error } = await supabaseAdmin
      .from("startups").select("*").eq("id", id).single();
    if (error || !data) return undefined;
    return toCamelCase(data) as Startup;
  }

  async getStartupByUserId(userId: number): Promise<Startup | undefined> {
    const { data, error } = await supabaseAdmin
      .from("startups").select("*").eq("user_id", userId).single();
    if (error || !data) return undefined;
    return toCamelCase(data) as Startup;
  }

  async createStartup(insertStartup: InsertStartup): Promise<Startup> {
    const { data, error } = await supabaseAdmin
      .from("startups").insert(toSnakeCase(insertStartup)).select().single();
    if (error) throw error;
    return toCamelCase(data) as Startup;
  }

  async updateStartup(id: number, updateData: Partial<Startup>): Promise<Startup> {
    const { data, error } = await supabaseAdmin
      .from("startups").update(toSnakeCase(updateData)).eq("id", id).select().single();
    if (error) throw error;
    return toCamelCase(data) as Startup;
  }

  async deleteStartup(id: number): Promise<void> {
    await supabaseAdmin.from("evaluations").delete().eq("startup_id", id);
    await supabaseAdmin.from("jury_assignments").delete().eq("startup_id", id);
    await supabaseAdmin.from("round_startups").delete().eq("startup_id", id);
    const { error } = await supabaseAdmin.from("startups").delete().eq("id", id);
    if (error) throw error;
  }

  // ── Evaluation criteria (legacy global) ──────────────────

  async getEvaluationCriteria(): Promise<EvaluationCriteria[]> {
    const { data, error } = await supabaseAdmin
      .from("evaluation_criteria").select("*").eq("is_active", true);
    if (error) throw error;
    return (data || []).map(toCamelCase) as EvaluationCriteria[];
  }

  async createEvaluationCriteria(insertCriteria: InsertEvaluationCriteria): Promise<EvaluationCriteria> {
    const { data, error } = await supabaseAdmin
      .from("evaluation_criteria").insert(toSnakeCase(insertCriteria)).select().single();
    if (error) throw error;
    return toCamelCase(data) as EvaluationCriteria;
  }

  async updateEvaluationCriteria(id: number, updateData: Partial<InsertEvaluationCriteria>): Promise<EvaluationCriteria> {
    const { data, error } = await supabaseAdmin
      .from("evaluation_criteria").update(toSnakeCase(updateData)).eq("id", id).select().single();
    if (error) throw error;
    return toCamelCase(data) as EvaluationCriteria;
  }

  // ── Jury assignments ─────────────────────────────────────

  async getJuryAssignments(juryId?: number, phaseId?: number, roundId?: number): Promise<JuryAssignment[]> {
    let query = supabaseAdmin.from("jury_assignments").select("*");
    if (juryId) query = query.eq("jury_id", juryId);
    if (phaseId) query = query.eq("phase_id", phaseId);
    if (roundId) query = query.eq("round_id", roundId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toCamelCase) as JuryAssignment[];
  }

  async createJuryAssignment(insertAssignment: InsertJuryAssignment): Promise<JuryAssignment> {
    const { data, error } = await supabaseAdmin
      .from("jury_assignments").insert(toSnakeCase(insertAssignment)).select().single();
    if (error) throw error;
    return toCamelCase(data) as JuryAssignment;
  }

  async deleteJuryAssignment(id: number): Promise<void> {
    const { error } = await supabaseAdmin.from("jury_assignments").delete().eq("id", id);
    if (error) throw error;
  }

  // ── Evaluations ──────────────────────────────────────────

  async getEvaluations(phaseId?: number, roundId?: number): Promise<Evaluation[]> {
    let query = supabaseAdmin.from("evaluations").select("*");
    if (phaseId) query = query.eq("phase_id", phaseId);
    if (roundId) query = query.eq("round_id", roundId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toCamelCase) as Evaluation[];
  }

  async getEvaluation(juryId: number, startupId: number, roundId?: number): Promise<Evaluation | undefined> {
    let query = supabaseAdmin.from("evaluations").select("*")
      .eq("jury_id", juryId).eq("startup_id", startupId);
    if (roundId) query = query.eq("round_id", roundId);
    const { data, error } = await query.single();
    if (error || !data) return undefined;
    return toCamelCase(data) as Evaluation;
  }

  async getEvaluationsByStartupId(startupId: number): Promise<Evaluation[]> {
    const { data, error } = await supabaseAdmin
      .from("evaluations").select("*").eq("startup_id", startupId);
    if (error) throw error;
    return (data || []).map(toCamelCase) as Evaluation[];
  }

  async createEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    const { data, error } = await supabaseAdmin
      .from("evaluations").insert(toSnakeCase(insertEvaluation)).select().single();
    if (error) throw error;
    return toCamelCase(data) as Evaluation;
  }

  async updateEvaluation(id: number, updateData: Partial<InsertEvaluation>): Promise<Evaluation> {
    const { data, error } = await supabaseAdmin
      .from("evaluations")
      .update({ ...toSnakeCase(updateData), updated_at: new Date().toISOString() })
      .eq("id", id).select().single();
    if (error) throw error;
    return toCamelCase(data) as Evaluation;
  }

  async upsertEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const existing = await this.getEvaluation(
      evaluation.juryId!,
      evaluation.startupId!,
      evaluation.roundId ?? undefined
    );
    if (existing) {
      return this.updateEvaluation(existing.id, evaluation);
    }
    return this.createEvaluation(evaluation);
  }

  async getDuplicateEvaluations(): Promise<{ juryId: number; startupId: number; roundId: number | null; count: number; ids: number[] }[]> {
    const { data, error } = await supabaseAdmin.from("evaluations").select("*");
    if (error) throw error;
    const groups = new Map<string, any[]>();
    for (const row of data || []) {
      const key = `${row.jury_id}-${row.startup_id}-${row.round_id ?? "null"}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }
    const duplicates: { juryId: number; startupId: number; roundId: number | null; count: number; ids: number[] }[] = [];
    for (const [, rows] of Array.from(groups.entries())) {
      if (rows.length > 1) {
        duplicates.push({
          juryId: rows[0].jury_id,
          startupId: rows[0].startup_id,
          roundId: rows[0].round_id ?? null,
          count: rows.length,
          ids: rows.map((r: any) => r.id),
        });
      }
    }
    return duplicates;
  }

  async deduplicateEvaluations(): Promise<{ removed: number }> {
    const { data, error } = await supabaseAdmin
      .from("evaluations").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    const seen = new Set<string>();
    const toDelete: number[] = [];
    for (const row of data || []) {
      const key = `${row.jury_id}-${row.startup_id}-${row.round_id ?? "null"}`;
      if (seen.has(key)) {
        toDelete.push(row.id);
      } else {
        seen.add(key);
      }
    }
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin.from("evaluations").delete().in("id", toDelete);
      if (deleteError) throw deleteError;
    }
    return { removed: toDelete.length };
  }

  // ── Decision labels ──────────────────────────────────────

  async getDecisionLabels(): Promise<DecisionLabel[]> {
    const { data, error } = await supabaseAdmin.from("decision_labels").select("*");
    if (error) throw error;
    return (data || []).map(toCamelCase) as DecisionLabel[];
  }

  async createDecisionLabel(insertLabel: InsertDecisionLabel): Promise<DecisionLabel> {
    const { data, error } = await supabaseAdmin
      .from("decision_labels").insert(toSnakeCase(insertLabel)).select().single();
    if (error) throw error;
    return toCamelCase(data) as DecisionLabel;
  }

  // ── Analytics ────────────────────────────────────────────

  async getStartupScores(phaseId?: number, roundId?: number): Promise<any[]> {
    let startupQuery = supabaseAdmin.from("startups").select("*");
    if (phaseId) startupQuery = startupQuery.eq("phase_id", phaseId);
    const { data: startups, error: sErr } = await startupQuery;
    if (sErr) throw sErr;

    let evalQuery = supabaseAdmin.from("evaluations").select("*");
    if (phaseId) evalQuery = evalQuery.eq("phase_id", phaseId);
    if (roundId) evalQuery = evalQuery.eq("round_id", roundId);
    const { data: evaluations, error: eErr } = await evalQuery;
    if (eErr) throw eErr;

    return (startups || []).map((s: any) => {
      const startupEvals = (evaluations || []).filter((e: any) => e.startup_id === s.id);
      const scores = startupEvals
        .map((e: any) => {
          if (!e.scores || typeof e.scores !== 'object') return null;
          const values = Object.values(e.scores).map(v => typeof v === 'number' ? v : parseFloat(v as string)).filter((v): v is number => !isNaN(v));
          return values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : null;
        })
        .filter((v: number | null): v is number => v !== null);

      return {
        startupId: s.id,
        startupName: s.name,
        category: s.category,
        avgScore: scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null,
        evaluationCount: startupEvals.length,
        decision: startupEvals.length > 0 ? startupEvals[0].decision : null,
      };
    });
  }

  async getEvaluationStats(phaseId?: number, roundId?: number): Promise<any> {
    let startupQuery = supabaseAdmin.from("startups").select("id");
    if (phaseId) startupQuery = startupQuery.eq("phase_id", phaseId);
    const { data: startups, error: sErr } = await startupQuery;
    if (sErr) throw sErr;

    let evalQuery = supabaseAdmin.from("evaluations").select("*");
    if (phaseId) evalQuery = evalQuery.eq("phase_id", phaseId);
    if (roundId) evalQuery = evalQuery.eq("round_id", roundId);
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
