import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seed() {
  console.log("🌱 Seeding database...\n");

  // ── 1. Jury users ────────────────────────────────────────────
  console.log("Creating jury users...");
  const juryEmails = [
    { email: "sarah.chen@scorer.ai", name: "Sarah Chen" },
    { email: "marco.rossi@scorer.ai", name: "Marco Rossi" },
    { email: "aisha.patel@scorer.ai", name: "Aisha Patel" },
  ];

  const juryIds: number[] = [];
  for (const jury of juryEmails) {
    // Create auth user
    const { data: authData } = await supabase.auth.admin.createUser({
      email: jury.email,
      password: "Password123!",
      email_confirm: true,
    });

    // Insert into users table
    const { data: userData, error } = await supabase
      .from("users")
      .upsert({ email: jury.email, name: jury.name, role: "jury", password: "hashed", is_active: true }, { onConflict: "email" })
      .select("id")
      .single();

    if (error) { console.error("  User error:", error.message); continue; }
    juryIds.push(userData.id);
    console.log(`  ✓ ${jury.name} (id: ${userData.id})`);
  }

  // ── 2. Cohorts ───────────────────────────────────────────────
  console.log("\nCreating cohorts...");
  const { data: cohorts, error: cohortErr } = await supabase
    .from("cohorts")
    .insert([
      { name: "Cohort 2024", description: "Spring 2024 accelerator batch", is_active: true },
      { name: "Cohort 2025", description: "Spring 2025 accelerator batch", is_active: true },
    ])
    .select();

  if (cohortErr) { console.error("Cohort error:", cohortErr.message); process.exit(1); }
  console.log(`  ✓ ${cohorts.map((c: any) => c.name).join(", ")}`);

  // ── 3. Rounds ────────────────────────────────────────────────
  console.log("\nCreating rounds...");
  const roundsToInsert = [];
  for (const cohort of cohorts) {
    roundsToInsert.push(
      { cohort_id: cohort.id, name: "Application Review", description: "Initial screening of applications", order: 1, is_active: false },
      { cohort_id: cohort.id, name: "Pitch Day", description: "Live pitch presentations", order: 2, is_active: false },
      { cohort_id: cohort.id, name: "Final Selection", description: "Final evaluation and selection", order: 3, is_active: true }
    );
  }
  const { data: rounds, error: roundErr } = await supabase.from("rounds").insert(roundsToInsert).select();
  if (roundErr) { console.error("Round error:", roundErr.message); process.exit(1); }
  console.log(`  ✓ ${rounds.length} rounds created`);

  // ── 4. Round criteria ────────────────────────────────────────
  console.log("\nCreating round criteria...");
  const criteriaRows = [];
  for (const round of rounds) {
    if (round.name === "Application Review") {
      criteriaRows.push(
        { round_id: round.id, name: "Problem Clarity", type: "scale", scale_min: 1, scale_max: 5, order: 1 },
        { round_id: round.id, name: "Market Size", type: "scale", scale_min: 1, scale_max: 5, order: 2 },
        { round_id: round.id, name: "Team Completeness", type: "binary", order: 3 },
        { round_id: round.id, name: "Application Quality", type: "scale", scale_min: 1, scale_max: 10, order: 4 },
      );
    } else if (round.name === "Pitch Day") {
      criteriaRows.push(
        { round_id: round.id, name: "Presentation Quality", type: "scale", scale_min: 1, scale_max: 10, order: 1 },
        { round_id: round.id, name: "Business Model", type: "scale", scale_min: 1, scale_max: 10, order: 2 },
        { round_id: round.id, name: "Traction", type: "scale", scale_min: 1, scale_max: 10, order: 3 },
        { round_id: round.id, name: "Q&A Performance", type: "scale", scale_min: 1, scale_max: 10, order: 4 },
        { round_id: round.id, name: "Investable?", type: "binary", order: 5 },
      );
    } else {
      criteriaRows.push(
        { round_id: round.id, name: "Overall Score", type: "scale", scale_min: 1, scale_max: 10, order: 1 },
        { round_id: round.id, name: "Team", type: "scale", scale_min: 1, scale_max: 10, order: 2 },
        { round_id: round.id, name: "Product", type: "scale", scale_min: 1, scale_max: 10, order: 3 },
        { round_id: round.id, name: "Market", type: "scale", scale_min: 1, scale_max: 10, order: 4 },
        { round_id: round.id, name: "Traction", type: "scale", scale_min: 1, scale_max: 10, order: 5 },
        { round_id: round.id, name: "Investment Ready", type: "binary", order: 6 },
        { round_id: round.id, name: "Notes", type: "text", order: 7 },
      );
    }
  }
  const { error: critErr } = await supabase.from("round_criteria").insert(criteriaRows);
  if (critErr) { console.error("Criteria error:", critErr.message); process.exit(1); }
  console.log(`  ✓ ${criteriaRows.length} criteria created`);

  // ── 5. Startups ──────────────────────────────────────────────
  console.log("\nCreating startups...");
  const startupDefs = [
    { name: "NovaMed", category: "HealthTech", stage: "Seed", founded: "2022", team_size: "8", funding_seek: "$500K", description: "AI-powered diagnostics for rural clinics" },
    { name: "GreenLoop", category: "CleanTech", stage: "Pre-Seed", founded: "2023", team_size: "5", funding_seek: "$250K", description: "Circular economy platform for SMEs" },
    { name: "EduPilot", category: "EdTech", stage: "Series A", founded: "2021", team_size: "14", funding_seek: "$2M", description: "Adaptive learning for K-12 students" },
    { name: "Freightify", category: "Logistics", stage: "Seed", founded: "2022", team_size: "10", funding_seek: "$750K", description: "Freight marketplace connecting shippers and carriers" },
    { name: "Cropwise", category: "AgriTech", stage: "Pre-Seed", founded: "2023", team_size: "4", funding_seek: "$200K", description: "IoT soil monitoring for smallholder farmers" },
    { name: "LexAI", category: "LegalTech", stage: "Seed", founded: "2022", team_size: "7", funding_seek: "$1M", description: "Contract analysis powered by LLMs" },
    { name: "Paynow", category: "FinTech", stage: "Series A", founded: "2020", team_size: "20", funding_seek: "$5M", description: "Embedded payments for African e-commerce" },
    { name: "BuildBot", category: "PropTech", stage: "Seed", founded: "2023", team_size: "6", funding_seek: "$600K", description: "Autonomous construction site monitoring" },
  ];

  const allStartups: any[] = [];
  for (let i = 0; i < startupDefs.length; i++) {
    const cohort = cohorts[i < 5 ? 0 : 1]; // first 5 → cohort 1, rest → cohort 2
    const { data, error } = await supabase
      .from("startups")
      .insert({ ...startupDefs[i], cohort_id: cohort.id })
      .select()
      .single();
    if (error) { console.error(`  Startup error (${startupDefs[i].name}):`, error.message); continue; }
    allStartups.push(data);
    console.log(`  ✓ ${data.name} → ${cohort.name}`);
  }

  // ── 6. Assign startups to rounds ─────────────────────────────
  console.log("\nAssigning startups to rounds...");
  const roundStartupRows: any[] = [];
  for (const startup of allStartups) {
    // Find all rounds in the startup's cohort
    const cohortRounds = rounds.filter((r: any) => r.cohort_id === startup.cohort_id);
    for (const round of cohortRounds) {
      // All startups in round 1, top 6 advance to round 2, top 4 to round 3
      const idx = allStartups.filter((s: any) => s.cohort_id === startup.cohort_id).indexOf(startup);
      if (round.order === 1) roundStartupRows.push({ round_id: round.id, startup_id: startup.id });
      else if (round.order === 2 && idx < 4) roundStartupRows.push({ round_id: round.id, startup_id: startup.id });
      else if (round.order === 3 && idx < 3) roundStartupRows.push({ round_id: round.id, startup_id: startup.id });
    }
  }
  const { error: rsErr } = await supabase.from("round_startups").insert(roundStartupRows);
  if (rsErr) { console.error("Round startups error:", rsErr.message); }
  else console.log(`  ✓ ${roundStartupRows.length} assignments`);

  // ── 7. Jury assignments ──────────────────────────────────────
  console.log("\nCreating jury assignments...");
  if (juryIds.length > 0) {
    const assignRows: any[] = [];
    for (const round of rounds) {
      const roundSUs = roundStartupRows.filter((r: any) => r.round_id === round.id);
      for (const rs of roundSUs) {
        for (const juryId of juryIds) {
          assignRows.push({ jury_id: juryId, startup_id: rs.startup_id, round_id: round.id });
        }
      }
    }
    const { error: assignErr } = await supabase.from("jury_assignments").insert(assignRows);
    if (assignErr) console.error("  Assignment error:", assignErr.message);
    else console.log(`  ✓ ${assignRows.length} jury assignments`);
  }

  // ── 8. Evaluations ───────────────────────────────────────────
  console.log("\nCreating sample evaluations...");
  if (juryIds.length > 0) {
    // Get all criteria by round
    const { data: allCriteria } = await supabase.from("round_criteria").select("*");
    const evalRows: any[] = [];

    for (const round of rounds) {
      const criteria = (allCriteria || []).filter((c: any) => c.round_id === round.id);
      if (!criteria.length) continue;
      const roundSUs = roundStartupRows.filter((r: any) => r.round_id === round.id);

      for (const rs of roundSUs) {
        for (const juryId of juryIds) {
          const scores: Record<string, any> = {};
          for (const c of criteria) {
            if (c.type === "scale") {
              const min = c.scale_min ?? 1;
              const max = c.scale_max ?? 5;
              scores[c.id] = Math.floor(Math.random() * (max - min + 1)) + min;
            } else if (c.type === "binary") {
              scores[c.id] = Math.random() > 0.35 ? "yes" : "no";
            } else {
              scores[c.id] = "Solid team, good traction.";
            }
          }
          const decisions = ["yes", "maybe", "no"];
          evalRows.push({
            jury_id: juryId,
            startup_id: rs.startup_id,
            round_id: round.id,
            scores,
            comments: Math.random() > 0.4 ? "Strong fundamentals, needs clearer go-to-market." : null,
            decision: decisions[Math.floor(Math.random() * decisions.length)],
            is_completed: true,
            submitted_at: new Date().toISOString(),
          });
        }
      }
    }

    const chunkSize = 50;
    for (let i = 0; i < evalRows.length; i += chunkSize) {
      const { error: evalErr } = await supabase.from("evaluations").insert(evalRows.slice(i, i + chunkSize));
      if (evalErr) { console.error("  Eval error:", evalErr.message); break; }
    }
    console.log(`  ✓ ${evalRows.length} evaluations created`);
  }

  console.log("\n✅ Seed complete!");
}

seed().catch(err => { console.error(err); process.exit(1); });
