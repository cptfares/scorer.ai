import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPhaseSchema, insertStartupSchema, insertEvaluationCriteriaSchema, insertJuryAssignmentSchema, insertEvaluationSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";

// Extend session types
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      email: string;
      name: string;
      role: string;
    };
  }
}

// Session middleware setup
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

// Authentication middleware
function requireAuth(req: any, res: Response, next: NextFunction) {
  if (req.session?.user) {
    next();
  } else {
    res.status(401).json({ error: "Authentication required" });
  }
}

function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (req.session?.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: "Admin access required" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply session middleware
  app.use(sessionMiddleware);

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      (req.session as any).user = { id: user.id, email: user.email, name: user.name, role: user.role };
      res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req: any, res) => {
    if (req.session?.user) {
      res.json({ user: req.session.user });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // User routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const role = req.query.role as string;
      const users = role ? await storage.getUsersByRole(role) : [];
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
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

  app.post("/api/startups", async (req, res) => {
    try {
      const startupData = insertStartupSchema.parse(req.body);
      const startup = await storage.createStartup(startupData);
      res.json(startup);
    } catch (error) {
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

  app.delete("/api/startups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteStartup(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete startup" });
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

  app.post("/api/jury-assignments", async (req, res) => {
    try {
      const assignmentData = insertJuryAssignmentSchema.parse(req.body);
      const assignment = await storage.createJuryAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ error: "Invalid assignment data" });
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
