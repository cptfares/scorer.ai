import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data: round, error } = await supabase
    .from("rounds").select("id").ilike("name", "%First Phase%").limit(1).single();

  if (error || !round) { console.error("Round not found:", error?.message); process.exit(1); }
  console.log("Round id:", round.id);

  const { error: e1 } = await supabase.from("round_criteria")
    .update({ weight: 4 })
    .eq("round_id", round.id)
    .in("name", ["Strength of the Business Idea", "Market Attractiveness", "Competitive Advantage", "Business Model", "Team"]);

  const { error: e2 } = await supabase.from("round_criteria")
    .update({ weight: 1 })
    .eq("round_id", round.id)
    .eq("name", "Impact Bonus");

  if (e1) console.error("Error setting ×4 weights:", e1.message);
  else console.log("Set weight=4 for 5 main criteria ✓");

  if (e2) console.error("Error setting Impact Bonus weight:", e2.message);
  else console.log("Set weight=1 for Impact Bonus ✓");
}

main();
