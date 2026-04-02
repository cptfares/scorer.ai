import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CRITERIA = [
  {
    name: "Strength of the Business Idea",
    description: "Clear problem, Clear Innovative Solution, Value Proposition",
    type: "scale",
    scale_min: 1,
    scale_max: 5,
    order: 0,
    is_active: true,
  },
  {
    name: "Market Attractiveness",
    description: "Size, Growth, Segmentation, Target",
    type: "scale",
    scale_min: 1,
    scale_max: 5,
    order: 1,
    is_active: true,
  },
  {
    name: "Competitive Advantage",
    description: "Unique Selling Proposition, defensibility, Industry life cycle, Positioning of local & international players, differentiation",
    type: "scale",
    scale_min: 1,
    scale_max: 5,
    order: 2,
    is_active: true,
  },
  {
    name: "Business Model",
    description: "Scalability, Revenue Streams, Need for funds",
    type: "scale",
    scale_min: 1,
    scale_max: 5,
    order: 3,
    is_active: true,
  },
  {
    name: "Team",
    description: "Strong founders, Complementarity, Dedication",
    type: "scale",
    scale_min: 1,
    scale_max: 5,
    order: 4,
    is_active: true,
  },
  {
    name: "Impact Bonus",
    description: "Social Entrepreneurship: Environment, Social Impact, Inclusiveness",
    type: "scale",
    scale_min: 1,
    scale_max: 5,
    order: 5,
    is_active: true,
  },
];

async function main() {
  // 1. Find the 5th cohort
  const { data: cohorts, error: cohortErr } = await supabase
    .from("cohorts")
    .select("*")
    .ilike("name", "%5th%");

  if (cohortErr || !cohorts?.length) {
    console.error("Could not find 5th cohort:", cohortErr?.message);
    process.exit(1);
  }

  const cohort = cohorts[0];
  console.log(`Found cohort: ${cohort.name} (id=${cohort.id})`);

  // 2. Check if round already exists
  const { data: existingRounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("cohort_id", cohort.id)
    .ilike("name", "%First Phase%");

  if (existingRounds?.length) {
    console.log(`Round already exists: ${existingRounds[0].name} (id=${existingRounds[0].id})`);
    console.log("Skipping round creation. Delete it first if you want to re-seed.");
    process.exit(0);
  }

  // 3. Create the round
  const { data: round, error: roundErr } = await supabase
    .from("rounds")
    .insert({
      cohort_id: cohort.id,
      name: "First Phase Pitching",
      description: "Initial pitch evaluation round for the 5th cohort",
      order: 1,
      is_active: true,
    })
    .select()
    .single();

  if (roundErr || !round) {
    console.error("Failed to create round:", roundErr?.message);
    process.exit(1);
  }
  console.log(`Created round: ${round.name} (id=${round.id})`);

  // 4. Insert all criteria
  const { data: inserted, error: criteriaErr } = await supabase
    .from("round_criteria")
    .insert(CRITERIA.map(c => ({ ...c, round_id: round.id })))
    .select();

  if (criteriaErr) {
    console.error("Failed to insert criteria:", criteriaErr.message);
    process.exit(1);
  }

  console.log(`Inserted ${inserted?.length} criteria:`);
  inserted?.forEach(c => console.log(`  - ${c.name}`));
  console.log("\nDone!");
}

main();
