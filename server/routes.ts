import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema, insertPhaseSchema, insertStartupSchema,
  insertEvaluationCriteriaSchema, insertJuryAssignmentSchema, insertEvaluationSchema,
  insertCohortSchema, insertRoundSchema, insertRoundCriteriaSchema
} from "@shared/schema";
import { z } from "zod";
import { supabaseAdmin } from "./supabase";
import bcrypt from "bcrypt";

async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing authorization header" });

  const token = authHeader.split(' ')[1];

  try {
    // Decode JWT payload without verification — Supabase already validated it on login
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    const email = payload.email;
    if (!email) return res.status(401).json({ error: "Invalid token" });

    const dbUser = await storage.getUserByEmail(email);
    if (!dbUser) return res.status(401).json({ error: "User not found in database" });

    (req as any).user = { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireAuth(req: any, res: Response, next: NextFunction) {
  if (req.user) next();
  else res.status(401).json({ error: "Authentication required" });
}

function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (req.user?.role === 'admin') next();
  else res.status(403).json({ error: "Admin access required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api", (req, res, next) => {
    if (req.path === "/auth/login" || req.path === "/auth/logout" || req.method === "OPTIONS") {
      return next();
    }
    authenticateUser(req, res, next);
  });

  // ── Auth ─────────────────────────────────────────────────

  app.post("/api/auth/login", async (req, res) => {
    const { email, session } = req.body;
    if (!session || !email) return res.status(400).json({ error: "Session and email required" });
    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found in database" });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });

  app.post("/api/auth/logout", (req, res) => res.json({ success: true }));

  app.get("/api/auth/me", (req: any, res) => {
    if (req.user) res.json({ user: req.user });
    else res.status(401).json({ error: "Not authenticated" });
  });

  // ── Users ────────────────────────────────────────────────

  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const role = req.query.role as string;
      const users = role ? await storage.getUsersByRole(role) : await storage.getAllUsers();
      res.json(users);
    } catch { res.status(500).json({ error: "Failed to fetch users" }); }
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteUser(parseInt(req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to delete user" }); }
  });

  app.post("/api/users/invite", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { email, name, role = "jury" } = req.body;
      if (!["jury", "founder"].includes(role))
        return res.status(400).json({ error: "Invalid role. Must be 'jury' or 'founder'" });

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) return res.status(400).json({ error: "User with this email already exists" });

      const generatedPassword = Math.random().toString(36).slice(-10);
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email, password: generatedPassword, email_confirm: true,
        user_metadata: { full_name: name, role }
      });
      if (createError) return res.status(500).json({ error: createError.message });

      const hashedPassword = await bcrypt.hash(generatedPassword, 10);
      const user = await storage.createUser({ email, name, password: hashedPassword, role, isActive: true });
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        password: generatedPassword,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully.`
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create user", details: error.message });
    }
  });

  app.patch("/api/users/me", requireAuth, async (req: any, res) => {
    try {
      const { phoneNumber, bio, name } = req.body;
      const updatedUser = await storage.updateUser(req.user.id, { name, phoneNumber, bio });
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update profile", details: error.message });
    }
  });

  // ── Cohorts ──────────────────────────────────────────────

  app.get("/api/cohorts", requireAuth, async (req, res) => {
    try {
      const cohorts = await storage.getCohorts();
      res.json(cohorts);
    } catch { res.status(500).json({ error: "Failed to fetch cohorts" }); }
  });

  app.get("/api/cohorts/:id", requireAuth, async (req, res) => {
    try {
      const cohort = await storage.getCohort(parseInt(req.params.id));
      if (!cohort) return res.status(404).json({ error: "Cohort not found" });
      res.json(cohort);
    } catch { res.status(500).json({ error: "Failed to fetch cohort" }); }
  });

  app.post("/api/cohorts", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = insertCohortSchema.parse(req.body);
      const cohort = await storage.createCohort(data);
      res.json(cohort);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid cohort data", details: error.message });
    }
  });

  app.patch("/api/cohorts/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = insertCohortSchema.partial().parse(req.body);
      const cohort = await storage.updateCohort(parseInt(req.params.id), data);
      res.json(cohort);
    } catch { res.status(400).json({ error: "Invalid cohort data" }); }
  });

  app.delete("/api/cohorts/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteCohort(parseInt(req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to delete cohort" }); }
  });

  // ── Rounds ───────────────────────────────────────────────

  app.get("/api/cohorts/:cohortId/rounds", requireAuth, async (req, res) => {
    try {
      const rounds = await storage.getRounds(parseInt(req.params.cohortId));
      res.json(rounds);
    } catch { res.status(500).json({ error: "Failed to fetch rounds" }); }
  });

  app.get("/api/rounds/:id", requireAuth, async (req, res) => {
    try {
      const round = await storage.getRound(parseInt(req.params.id));
      if (!round) return res.status(404).json({ error: "Round not found" });
      res.json(round);
    } catch { res.status(500).json({ error: "Failed to fetch round" }); }
  });

  app.post("/api/cohorts/:cohortId/rounds", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = insertRoundSchema.parse({ ...req.body, cohortId: parseInt(req.params.cohortId) });
      const round = await storage.createRound(data);
      res.json(round);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid round data", details: error.message });
    }
  });

  app.patch("/api/rounds/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = insertRoundSchema.partial().parse(req.body);
      const round = await storage.updateRound(parseInt(req.params.id), data);
      res.json(round);
    } catch { res.status(400).json({ error: "Invalid round data" }); }
  });

  app.delete("/api/rounds/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteRound(parseInt(req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to delete round" }); }
  });

  // ── Round criteria ───────────────────────────────────────

  app.get("/api/rounds/:roundId/criteria", requireAuth, async (req, res) => {
    try {
      const criteria = await storage.getRoundCriteria(parseInt(req.params.roundId));
      res.json(criteria);
    } catch { res.status(500).json({ error: "Failed to fetch criteria" }); }
  });

  app.post("/api/rounds/:roundId/criteria", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = insertRoundCriteriaSchema.parse({ ...req.body, roundId: parseInt(req.params.roundId) });
      const criteria = await storage.createRoundCriteria(data);
      res.json(criteria);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid criteria data", details: error.message });
    }
  });

  app.patch("/api/rounds/:roundId/criteria/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = insertRoundCriteriaSchema.partial().parse(req.body);
      const criteria = await storage.updateRoundCriteria(parseInt(req.params.id), data);
      res.json(criteria);
    } catch { res.status(400).json({ error: "Invalid criteria data" }); }
  });

  app.delete("/api/rounds/:roundId/criteria/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteRoundCriteria(parseInt(req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to delete criteria" }); }
  });

  // ── Round startups ───────────────────────────────────────

  app.get("/api/rounds/:roundId/startups", requireAuth, async (req, res) => {
    try {
      const startups = await storage.getRoundStartups(parseInt(req.params.roundId));
      res.json(startups);
    } catch { res.status(500).json({ error: "Failed to fetch round startups" }); }
  });

  app.post("/api/rounds/:roundId/startups", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { startupId } = req.body;
      if (!startupId) return res.status(400).json({ error: "startupId is required" });
      const result = await storage.addStartupToRound(parseInt(req.params.roundId), parseInt(startupId));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: "Failed to add startup to round", details: error.message });
    }
  });

  app.delete("/api/rounds/:roundId/startups/:startupId", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.removeStartupFromRound(parseInt(req.params.roundId), parseInt(req.params.startupId));
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to remove startup from round" }); }
  });

  // ── Phases (legacy) ──────────────────────────────────────

  app.get("/api/phases", async (req, res) => {
    try { res.json(await storage.getPhases()); }
    catch { res.status(500).json({ error: "Failed to fetch phases" }); }
  });

  app.get("/api/phases/active", async (req, res) => {
    try { res.json(await storage.getActivePhase()); }
    catch { res.status(500).json({ error: "Failed to fetch active phase" }); }
  });

  app.post("/api/phases", async (req, res) => {
    try {
      const phase = await storage.createPhase(insertPhaseSchema.parse(req.body));
      res.json(phase);
    } catch { res.status(400).json({ error: "Invalid phase data" }); }
  });

  // ── Startups ─────────────────────────────────────────────

  app.get("/api/startups", async (req, res) => {
    try {
      const phaseId = req.query.phaseId ? parseInt(req.query.phaseId as string) : undefined;
      const cohortId = req.query.cohortId ? parseInt(req.query.cohortId as string) : undefined;
      res.json(await storage.getStartups(phaseId, cohortId));
    } catch { res.status(500).json({ error: "Failed to fetch startups" }); }
  });

  app.get("/api/startups/me", requireAuth, async (req: any, res) => {
    try {
      const startup = await storage.getStartupByUserId(req.user.id);
      if (!startup) return res.status(404).json({ error: "No startup found for this user" });
      res.json(startup);
    } catch { res.status(500).json({ error: "Failed to fetch your startup" }); }
  });

  app.get("/api/startups/:id", async (req, res) => {
    try {
      const startup = await storage.getStartup(parseInt(req.params.id));
      if (!startup) return res.status(404).json({ error: "Startup not found" });
      res.json(startup);
    } catch { res.status(500).json({ error: "Failed to fetch startup" }); }
  });

  // Returns all rounds (with cohort info) that a startup belongs to
  app.get("/api/startups/:id/rounds", requireAuth, async (req, res) => {
    try {
      const startupId = parseInt(req.params.id);
      const { supabaseAdmin } = await import("./supabase");
      const { data, error } = await supabaseAdmin
        .from("round_startups")
        .select("round_id, rounds(id, name, order, cohort_id, cohorts(id, name))")
        .eq("startup_id", startupId);
      if (error) throw error;
      const result = (data || []).map((r: any) => ({
        roundId: r.round_id,
        roundName: r.rounds?.name,
        roundOrder: r.rounds?.order,
        cohortId: r.rounds?.cohort_id,
        cohortName: r.rounds?.cohorts?.name,
      }));
      res.json(result);
    } catch { res.status(500).json({ error: "Failed to fetch startup rounds" }); }
  });

  app.get("/api/startups/:id/evaluations", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const startup = await storage.getStartup(id);
      if (!startup) return res.status(404).json({ error: "Startup not found" });
      if (req.user.role !== 'admin' && startup.userId !== req.user.id)
        return res.status(403).json({ error: "Access denied" });
      res.json(await storage.getEvaluationsByStartupId(id));
    } catch { res.status(500).json({ error: "Failed to fetch evaluations" }); }
  });

  app.post("/api/startups", requireAuth, async (req: any, res) => {
    try {
      const startupData = {
        ...insertStartupSchema.parse(req.body),
        userId: req.user.role === 'founder' ? req.user.id : req.body.userId
      };
      res.json(await storage.createStartup(startupData));
    } catch (error: any) {
      res.status(400).json({ error: "Invalid startup data", details: error.message });
    }
  });

  app.put("/api/startups/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const startup = await storage.getStartup(id);
      if (!startup) return res.status(404).json({ error: "Startup not found" });
      if (req.user.role !== 'admin' && startup.userId !== req.user.id)
        return res.status(403).json({ error: "Access denied" });
      const data = insertStartupSchema.partial().parse(req.body);
      res.json(await storage.updateStartup(id, data));
    } catch { res.status(400).json({ error: "Invalid startup data" }); }
  });

  app.delete("/api/startups/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteStartup(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete startup", details: error.message });
    }
  });

  app.patch("/api/startups/:id/decision", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { finalDecision } = req.body;
      if (!finalDecision || !['accept', 'reject'].includes(finalDecision))
        return res.status(400).json({ error: "Invalid decision. Must be 'accept' or 'reject'" });
      res.json(await storage.updateStartup(parseInt(req.params.id), { finalDecision }));
    } catch { res.status(500).json({ error: "Failed to update startup decision" }); }
  });

  // ── Evaluation criteria (legacy) ─────────────────────────

  app.get("/api/evaluation-criteria", async (req, res) => {
    try { res.json(await storage.getEvaluationCriteria()); }
    catch { res.status(500).json({ error: "Failed to fetch evaluation criteria" }); }
  });

  app.post("/api/evaluation-criteria", async (req, res) => {
    try {
      res.json(await storage.createEvaluationCriteria(insertEvaluationCriteriaSchema.parse(req.body)));
    } catch { res.status(400).json({ error: "Invalid criteria data" }); }
  });

  // ── Jury assignments ─────────────────────────────────────

  app.get("/api/jury-assignments", async (req, res) => {
    try {
      const juryId = req.query.juryId ? parseInt(req.query.juryId as string) : undefined;
      const phaseId = req.query.phaseId ? parseInt(req.query.phaseId as string) : undefined;
      const roundId = req.query.roundId ? parseInt(req.query.roundId as string) : undefined;
      res.json(await storage.getJuryAssignments(juryId, phaseId, roundId));
    } catch { res.status(500).json({ error: "Failed to fetch jury assignments" }); }
  });

  app.post("/api/jury-assignments", requireAuth, requireAdmin, async (req, res) => {
    try {
      res.json(await storage.createJuryAssignment(insertJuryAssignmentSchema.parse(req.body)));
    } catch { res.status(400).json({ error: "Invalid assignment data" }); }
  });

  app.post("/api/jury-assignments/bulk", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { juryId: rawJuryId, startupIds, roundId: rawRoundId, phaseId: rawPhaseId } = req.body;
      const juryId = parseInt(rawJuryId?.toString());
      const roundId = rawRoundId ? parseInt(rawRoundId.toString()) : undefined;
      const phaseId = rawPhaseId ? parseInt(rawPhaseId.toString()) : undefined;

      if (isNaN(juryId) || !Array.isArray(startupIds))
        return res.status(400).json({ error: "juryId and startupIds (array) are required" });

      const existing = await storage.getJuryAssignments(juryId, phaseId, roundId);
      for (const ext of existing) await storage.deleteJuryAssignment(ext.id);

      const results = [];
      for (const startupId of startupIds) {
        results.push(await storage.createJuryAssignment({ juryId, startupId, phaseId, roundId }));
      }
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to process bulk assignments", details: error.message });
    }
  });

  app.delete("/api/jury-assignments/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteJuryAssignment(parseInt(req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to delete assignment" }); }
  });

  // ── Evaluations ──────────────────────────────────────────

  app.get("/api/evaluations", async (req, res) => {
    try {
      const phaseId = req.query.phaseId ? parseInt(req.query.phaseId as string) : undefined;
      const roundId = req.query.roundId ? parseInt(req.query.roundId as string) : undefined;
      res.json(await storage.getEvaluations(phaseId, roundId));
    } catch { res.status(500).json({ error: "Failed to fetch evaluations" }); }
  });

  app.get("/api/evaluations/:juryId/:startupId", async (req, res) => {
    try {
      const roundId = req.query.roundId ? parseInt(req.query.roundId as string) : undefined;
      res.json(await storage.getEvaluation(parseInt(req.params.juryId), parseInt(req.params.startupId), roundId));
    } catch { res.status(500).json({ error: "Failed to fetch evaluation" }); }
  });

  app.post("/api/evaluations", async (req, res) => {
    try {
      res.json(await storage.createEvaluation(insertEvaluationSchema.parse(req.body)));
    } catch { res.status(400).json({ error: "Invalid evaluation data" }); }
  });

  app.put("/api/evaluations/:id", async (req, res) => {
    try {
      res.json(await storage.updateEvaluation(parseInt(req.params.id), insertEvaluationSchema.partial().parse(req.body)));
    } catch { res.status(400).json({ error: "Invalid evaluation data" }); }
  });

  // ── Analytics ────────────────────────────────────────────

  app.get("/api/analytics/startup-scores", async (req, res) => {
    try {
      const phaseId = req.query.phaseId ? parseInt(req.query.phaseId as string) : undefined;
      const roundId = req.query.roundId ? parseInt(req.query.roundId as string) : undefined;
      res.json(await storage.getStartupScores(phaseId, roundId));
    } catch { res.status(500).json({ error: "Failed to fetch startup scores" }); }
  });

  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const phaseId = req.query.phaseId ? parseInt(req.query.phaseId as string) : undefined;
      const roundId = req.query.roundId ? parseInt(req.query.roundId as string) : undefined;
      res.json(await storage.getEvaluationStats(phaseId, roundId));
    } catch { res.status(500).json({ error: "Failed to fetch evaluation stats" }); }
  });

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  const httpServer = createServer(app);
  return httpServer;
}
