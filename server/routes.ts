// Force reload - Timestamp: 2026-02-11T22:58:00
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPhaseSchema, insertStartupSchema, insertEvaluationCriteriaSchema, insertJuryAssignmentSchema, insertEvaluationSchema } from "@shared/schema";
import { z } from "zod";
import { supabaseAdmin } from "./supabase";
import bcrypt from "bcrypt";

// Middleware to verify Supabase JWT
async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Fetch user from our database to get their role
  const dbUser = await storage.getUserByEmail(user.email!);
  if (!dbUser) {
    // Optionally create user in DB if they exist in Supabase but not in our DB
    return res.status(401).json({ error: "User not found in database" });
  }

  (req as any).user = {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role
  };
  next();
}

// Authentication middleware
function requireAuth(req: any, res: Response, next: NextFunction) {
  if (req.user) {
    next();
  } else {
    res.status(401).json({ error: "Authentication required" });
  }
}

function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (req.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: "Admin access required" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply session middleware
  // Apply authentication middleware to all /api routes except login/logout
  app.use("/api", (req, res, next) => {
    if (req.path === "/auth/login" || req.path === "/auth/logout" || req.method === "OPTIONS") {
      return next();
    }
    authenticateUser(req, res, next);
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    // Login is now primarily handled on the frontend via Supabase.
    // This endpoint can be used if session-like behavior is needed or for syncing.
    const { email, session } = req.body;

    if (!session || !email) {
      return res.status(400).json({ error: "Session and email required" });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found in database" });
    }

    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });

  app.post("/api/auth/logout", (req, res) => {
    // Logout is handled on the frontend
    res.json({ success: true });
  });

  app.get("/api/auth/me", (req: any, res) => {
    if (req.user) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // User routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const role = req.query.role as string;
      const users = role ? await storage.getUsersByRole(role) : await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      // Hash password before storing
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({ ...userData, password: hashedPassword });
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  // User invitation endpoint (jury or founder)
  app.post("/api/users/invite", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { email, name, role = "jury" } = req.body;

      if (!["jury", "founder"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'jury' or 'founder'" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Invite user via Supabase
      const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name, role: role },
        redirectTo: `${origin}/setup-password`
      });

      if (inviteError) {
        console.error("Supabase invite error:", inviteError);
        if (inviteError.message.includes("email rate limit exceeded")) {
          return res.status(429).json({
            error: "Email rate limit exceeded. Please wait a few minutes before inviting more users. This is a limit set by Supabase for security reasons."
          });
        }
        return res.status(500).json({ error: inviteError.message });
      }

      // Create user in local DB
      const user = await storage.createUser({
        email,
        name,
        password: "SUPABASE_MANAGED_AUTH",
        role,
        isActive: true
      });

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} invited successfully. An invitation email has been sent.`
      });
    } catch (error: any) {
      console.error("Error inviting user:", error);
      res.status(500).json({
        error: "Failed to invite user",
        details: error.message || String(error)
      });
    }
  });

  // Self-profile update endpoint
  app.patch("/api/users/me", requireAuth, async (req: any, res) => {
    try {
      const { phoneNumber, bio, name } = req.body;
      const userId = req.user.id;

      // WORKAROUND: The database schema for 'users' does not yet have 'bio' and 'phoneNumber'.
      // For now, we only update the 'name' and ignore the other fields to prevent 500 errors.
      const updatedUser = await storage.updateUser(userId, {
        name
      });

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile", details: error.message });
    }
  });

  // Phase routes
  app.get("/api/phases", async (req, res) => {
    try {
      const phases = await storage.getPhases();
      res.json(phases);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch phases" });
    }
  });

  app.get("/api/phases/active", async (req, res) => {
    try {
      const phase = await storage.getActivePhase();
      res.json(phase);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active phase" });
    }
  });

  app.post("/api/phases", async (req, res) => {
    try {
      const phaseData = insertPhaseSchema.parse(req.body);
      const phase = await storage.createPhase(phaseData);
      res.json(phase);
    } catch (error) {
      res.status(400).json({ error: "Invalid phase data" });
    }
  });

  // Startup routes
  app.get("/api/startups", async (req, res) => {
    try {
      const phaseId = req.query.phaseId ? parseInt(req.query.phaseId as string) : undefined;
      const startups = await storage.getStartups(phaseId);
      res.json(startups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch startups" });
    }
  });

  app.get("/api/startups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const startup = await storage.getStartup(id);
      if (!startup) {
        return res.status(404).json({ error: "Startup not found" });
      }
      res.json(startup);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch startup" });
    }
  });

  app.post("/api/startups", requireAuth, async (req: any, res) => {
    try {
      const startupData = insertStartupSchema.parse(req.body);

      // WORKAROUND: The 'startups' table is missing 'user_id' column.
      // We skip linking the startup to the user for now.
      // if (req.user.role === 'founder' && !startupData.userId) {
      //   startupData.userId = req.user.id;
      // }

      const startup = await storage.createStartup(startupData);
      res.json(startup);
    } catch (error) {
      console.error("Error creating startup:", error);
      res.status(400).json({ error: "Invalid startup data" });
    }
  });

  app.put("/api/startups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const startupData = insertStartupSchema.partial().parse(req.body);
      const startup = await storage.updateStartup(id, startupData);
      res.json(startup);
    } catch (error) {
      res.status(400).json({ error: "Invalid startup data" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: "2026-02-11T23:02:00" });
  });

  app.delete("/api/startups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteStartup(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting startup:", error);
      res.status(500).json({
        error: "Failed to delete startup - Server Source V2",
        details: error.message || String(error)
      });
    }
  });

  // Update startup final decision
  app.patch("/api/startups/:id/decision", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { finalDecision } = req.body;

      if (!finalDecision || !['accept', 'reject'].includes(finalDecision)) {
        return res.status(400).json({ error: "Invalid decision. Must be 'accept' or 'reject'" });
      }

      const startup = await storage.updateStartup(parseInt(id), { finalDecision });
      res.json(startup);
    } catch (error) {
      console.error("Error updating startup decision:", error);
      res.status(500).json({ error: "Failed to update startup decision" });
    }
  });

  // Evaluation criteria routes
  app.get("/api/evaluation-criteria", async (req, res) => {
    try {
      const criteria = await storage.getEvaluationCriteria();
      res.json(criteria);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evaluation criteria" });
    }
  });

  app.post("/api/evaluation-criteria", async (req, res) => {
    try {
      const criteriaData = insertEvaluationCriteriaSchema.parse(req.body);
      const criteria = await storage.createEvaluationCriteria(criteriaData);
      res.json(criteria);
    } catch (error) {
      res.status(400).json({ error: "Invalid criteria data" });
    }
  });

  // Jury assignment routes
  app.get("/api/jury-assignments", async (req, res) => {
    try {
      const juryId = req.query.juryId ? parseInt(req.query.juryId as string) : undefined;
      const phaseId = req.query.phaseId ? parseInt(req.query.phaseId as string) : undefined;
      const assignments = await storage.getJuryAssignments(juryId, phaseId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jury assignments" });
    }
  });

  app.post("/api/jury-assignments", requireAuth, requireAdmin, async (req, res) => {
    try {
      const assignmentData = insertJuryAssignmentSchema.parse(req.body);
      const assignment = await storage.createJuryAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ error: "Invalid assignment data" });
    }
  });

  app.post("/api/jury-assignments/bulk", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { juryId: rawJuryId, startupIds, phaseId: rawPhaseId } = req.body;
      const juryId = parseInt(rawJuryId?.toString());
      const phaseId = parseInt(rawPhaseId?.toString());

      if (isNaN(juryId) || !Array.isArray(startupIds) || isNaN(phaseId)) {
        return res.status(400).json({ error: "juryId, startupIds (array), and phaseId are required and must be valid" });
      }

      // Get existing assignments to avoid duplicates? 
      // Simplified: Clear existing for this jury/phase and re-add
      const existing = await storage.getJuryAssignments(juryId, phaseId);
      for (const ext of existing) {
        await storage.deleteJuryAssignment(ext.id);
      }

      const results = [];
      for (const startupId of startupIds) {
        const assignment = await storage.createJuryAssignment({
          juryId,
          startupId,
          phaseId
        });
        results.push(assignment);
      }

      res.json(results);
    } catch (error) {
      console.error("Bulk assignment error:", error);
      res.status(500).json({ error: "Failed to process bulk assignments" });
    }
  });

  app.delete("/api/jury-assignments/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteJuryAssignment(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete assignment" });
    }
  });

  // Evaluation routes
  app.get("/api/evaluations", async (req, res) => {
    try {
      const phaseId = req.query.phaseId ? parseInt(req.query.phaseId as string) : undefined;
      const evaluations = await storage.getEvaluations(phaseId);
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evaluations" });
    }
  });

  app.get("/api/evaluations/:juryId/:startupId", async (req, res) => {
    try {
      const juryId = parseInt(req.params.juryId);
      const startupId = parseInt(req.params.startupId);
      const evaluation = await storage.getEvaluation(juryId, startupId);
      res.json(evaluation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evaluation" });
    }
  });

  app.post("/api/evaluations", async (req, res) => {
    try {
      const evaluationData = insertEvaluationSchema.parse(req.body);
      const evaluation = await storage.createEvaluation(evaluationData);
      res.json(evaluation);
    } catch (error) {
      res.status(400).json({ error: "Invalid evaluation data" });
    }
  });

  app.put("/api/evaluations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const evaluationData = insertEvaluationSchema.partial().parse(req.body);
      const evaluation = await storage.updateEvaluation(id, evaluationData);
      res.json(evaluation);
    } catch (error) {
      res.status(400).json({ error: "Invalid evaluation data" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/startup-scores", async (req, res) => {
    try {
      const phaseId = req.query.phaseId ? parseInt(req.query.phaseId as string) : undefined;
      const scores = await storage.getStartupScores(phaseId);
      res.json(scores);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch startup scores" });
    }
  });

  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const phaseId = req.query.phaseId ? parseInt(req.query.phaseId as string) : undefined;
      const stats = await storage.getEvaluationStats(phaseId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evaluation stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
