import { storage } from "./storage";
import bcrypt from "bcrypt";

export async function setupDatabase() {
  try {
    // Create default admin user
    const adminEmail = "admin@startupeyal.com";
    const adminExists = await storage.getUserByEmail(adminEmail);
    if (!adminExists) {
      await storage.createUser({
        email: adminEmail,
        password: "SUPABASE_AUTH_MANAGED", // Password is managed by Supabase Auth
        name: "Admin User",
        role: "admin",
        isActive: true,
      });
      console.log(`Admin user record created for ${adminEmail}. Please ensure this user is also created in Supabase Auth.`);
    }

    // Create default evaluation criteria
    const existingCriteria = await storage.getEvaluationCriteria();
    if (existingCriteria.length === 0) {
      const defaultCriteria = [
        {
          name: "Market Opportunity",
          description: "Size and potential of the target market, market timing, and addressable market segments",
          order: 1,
          isActive: true,
        },
        {
          name: "Team Strength",
          description: "Experience, skills, track record, and complementarity of the founding team",
          order: 2,
          isActive: true,
        },
        {
          name: "Product Innovation",
          description: "Uniqueness, technical feasibility, and competitive advantage of the product or service",
          order: 3,
          isActive: true,
        },
        {
          name: "Business Model",
          description: "Revenue streams, cost structure, scalability, and financial sustainability",
          order: 4,
          isActive: true,
        },
        {
          name: "Traction & Growth",
          description: "Customer acquisition, revenue growth, partnerships, and market validation",
          order: 5,
          isActive: true,
        },
      ];

      for (const criteria of defaultCriteria) {
        await storage.createEvaluationCriteria(criteria);
      }
      console.log("Default evaluation criteria created");
    }

    // Create default decision labels
    const existingLabels = await storage.getDecisionLabels();
    if (existingLabels.length === 0) {
      const defaultLabels = [
        { value: "yes", label: "Recommend", description: "Strong recommendation for investment" },
        { value: "maybe", label: "Consider", description: "Potential with reservations" },
        { value: "no", label: "Pass", description: "Not recommended for investment" },
      ];

      for (const label of defaultLabels) {
        await storage.createDecisionLabel(label);
      }
      console.log("Default decision labels created");
    }

    // Create default active phase
    const activePhase = await storage.getActivePhase();
    if (!activePhase) {
      await storage.createPhase({
        name: "Spring 2025 Cohort",
        description: "Spring 2025 startup evaluation cohort",
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        isActive: true,
      });
      console.log("Default active phase created");
    }

    console.log("Database setup completed successfully");
  } catch (error) {
    console.error("Database setup failed:", error);
  }
}