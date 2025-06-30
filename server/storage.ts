import { 
  users, phases, startups, evaluationCriteria, juryAssignments, evaluations, decisionLabels,
  type User, type InsertUser, type Phase, type InsertPhase, type Startup, type InsertStartup,
  type EvaluationCriteria, type InsertEvaluationCriteria, type JuryAssignment, type InsertJuryAssignment,
  type Evaluation, type InsertEvaluation, type DecisionLabel, type InsertDecisionLabel
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;

  // Phase management
  getPhases(): Promise<Phase[]>;
  getActivePhase(): Promise<Phase | undefined>;
  createPhase(phase: InsertPhase): Promise<Phase>;
  updatePhase(id: number, phase: Partial<InsertPhase>): Promise<Phase>;

  // Startup management
  getStartups(phaseId?: number): Promise<Startup[]>;
  getStartup(id: number): Promise<Startup | undefined>;
  createStartup(startup: InsertStartup): Promise<Startup>;
  updateStartup(id: number, startup: Partial<InsertStartup>): Promise<Startup>;
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
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  updateEvaluation(id: number, evaluation: Partial<InsertEvaluation>): Promise<Evaluation>;

  // Decision labels
  getDecisionLabels(): Promise<DecisionLabel[]>;
  createDecisionLabel(label: InsertDecisionLabel): Promise<DecisionLabel>;

  // Analytics
  getStartupScores(phaseId?: number): Promise<any[]>;
  getEvaluationStats(phaseId?: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updateUser).where(eq(users.id, id)).returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async getPhases(): Promise<Phase[]> {
    return await db.select().from(phases).orderBy(desc(phases.createdAt));
  }

  async getActivePhase(): Promise<Phase | undefined> {
    const [phase] = await db.select().from(phases).where(eq(phases.isActive, true));
    return phase || undefined;
  }

  async createPhase(insertPhase: InsertPhase): Promise<Phase> {
    const [phase] = await db.insert(phases).values(insertPhase).returning();
    return phase;
  }

  async updatePhase(id: number, updatePhase: Partial<InsertPhase>): Promise<Phase> {
    const [phase] = await db.update(phases).set(updatePhase).where(eq(phases.id, id)).returning();
    return phase;
  }

  async getStartups(phaseId?: number): Promise<Startup[]> {
    if (phaseId) {
      return await db.select().from(startups).where(eq(startups.phaseId, phaseId));
    }
    return await db.select().from(startups);
  }

  async getStartup(id: number): Promise<Startup | undefined> {
    const [startup] = await db.select().from(startups).where(eq(startups.id, id));
    return startup || undefined;
  }

  async createStartup(insertStartup: InsertStartup): Promise<Startup> {
    const [startup] = await db.insert(startups).values(insertStartup).returning();
    return startup;
  }

  async updateStartup(id: number, updateStartup: Partial<InsertStartup>): Promise<Startup> {
    const [startup] = await db.update(startups).set(updateStartup).where(eq(startups.id, id)).returning();
    return startup;
  }

  async deleteStartup(id: number): Promise<void> {
    await db.delete(startups).where(eq(startups.id, id));
  }

  async getEvaluationCriteria(): Promise<EvaluationCriteria[]> {
    return await db.select().from(evaluationCriteria).where(eq(evaluationCriteria.isActive, true));
  }

  async createEvaluationCriteria(insertCriteria: InsertEvaluationCriteria): Promise<EvaluationCriteria> {
    const [criteria] = await db.insert(evaluationCriteria).values(insertCriteria).returning();
    return criteria;
  }

  async updateEvaluationCriteria(id: number, updateCriteria: Partial<InsertEvaluationCriteria>): Promise<EvaluationCriteria> {
    const [criteria] = await db.update(evaluationCriteria).set(updateCriteria).where(eq(evaluationCriteria.id, id)).returning();
    return criteria;
  }

  async getJuryAssignments(juryId?: number, phaseId?: number): Promise<JuryAssignment[]> {
    let query = db.select().from(juryAssignments);
    
    if (juryId && phaseId) {
      query = query.where(and(eq(juryAssignments.juryId, juryId), eq(juryAssignments.phaseId, phaseId)));
    } else if (juryId) {
      query = query.where(eq(juryAssignments.juryId, juryId));
    } else if (phaseId) {
      query = query.where(eq(juryAssignments.phaseId, phaseId));
    }
    
    return await query;
  }

  async createJuryAssignment(insertAssignment: InsertJuryAssignment): Promise<JuryAssignment> {
    const [assignment] = await db.insert(juryAssignments).values(insertAssignment).returning();
    return assignment;
  }

  async deleteJuryAssignment(id: number): Promise<void> {
    await db.delete(juryAssignments).where(eq(juryAssignments.id, id));
  }

  async getEvaluations(phaseId?: number): Promise<Evaluation[]> {
    if (phaseId) {
      return await db.select().from(evaluations).where(eq(evaluations.phaseId, phaseId));
    }
    return await db.select().from(evaluations);
  }

  async getEvaluation(juryId: number, startupId: number): Promise<Evaluation | undefined> {
    const [evaluation] = await db.select()
      .from(evaluations)
      .where(and(eq(evaluations.juryId, juryId), eq(evaluations.startupId, startupId)));
    return evaluation || undefined;
  }

  async createEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    const [evaluation] = await db.insert(evaluations).values(insertEvaluation).returning();
    return evaluation;
  }

  async updateEvaluation(id: number, updateEvaluation: Partial<InsertEvaluation>): Promise<Evaluation> {
    const [evaluation] = await db.update(evaluations)
      .set({ ...updateEvaluation, updatedAt: new Date() })
      .where(eq(evaluations.id, id))
      .returning();
    return evaluation;
  }

  async getDecisionLabels(): Promise<DecisionLabel[]> {
    return await db.select().from(decisionLabels);
  }

  async createDecisionLabel(insertLabel: InsertDecisionLabel): Promise<DecisionLabel> {
    const [label] = await db.insert(decisionLabels).values(insertLabel).returning();
    return label;
  }

  async getStartupScores(phaseId?: number): Promise<any[]> {
    let query = db
      .select({
        startupId: startups.id,
        startupName: startups.name,
        category: startups.category,
        avgScore: sql<number>`AVG(CAST(jsonb_extract_path_text(${evaluations.scores}, 'average') AS FLOAT))`,
        evaluationCount: sql<number>`COUNT(${evaluations.id})`,
        decision: evaluations.decision,
      })
      .from(startups)
      .leftJoin(evaluations, eq(startups.id, evaluations.startupId))
      .groupBy(startups.id, startups.name, startups.category, evaluations.decision);

    if (phaseId) {
      query = query.where(eq(startups.phaseId, phaseId));
    }

    return await query;
  }

  async getEvaluationStats(phaseId?: number): Promise<any> {
    let query = db
      .select({
        totalStartups: sql<number>`COUNT(DISTINCT ${startups.id})`,
        totalEvaluations: sql<number>`COUNT(${evaluations.id})`,
        completedEvaluations: sql<number>`COUNT(CASE WHEN ${evaluations.isCompleted} THEN 1 END)`,
        avgScore: sql<number>`AVG(CAST(jsonb_extract_path_text(${evaluations.scores}, 'average') AS FLOAT))`,
      })
      .from(startups)
      .leftJoin(evaluations, eq(startups.id, evaluations.startupId));

    if (phaseId) {
      query = query.where(eq(startups.phaseId, phaseId));
    }

    const [stats] = await query;
    return stats;
  }
}

export const storage = new DatabaseStorage();
