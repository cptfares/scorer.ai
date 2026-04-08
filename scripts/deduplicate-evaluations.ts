import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  // 1. Fetch ALL evaluations
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) { console.error("Fetch error:", error); process.exit(1); }

  const all = data ?? [];

  // 2. Save full backup
  const backupPath = path.join(
    __dirname,
    `evaluations-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  );
  fs.writeFileSync(backupPath, JSON.stringify(all, null, 2));
  console.log(`Backup saved: ${backupPath} (${all.length} records)`);

  // 3. Identify duplicates — keep the most recently updated row per (jury, startup, round)
  const seen = new Set<string>();
  const toDelete: number[] = [];

  for (const row of all) {
    const key = `${row.jury_id}-${row.startup_id}-${row.round_id ?? "null"}`;
    if (seen.has(key)) {
      toDelete.push(row.id);
    } else {
      seen.add(key);
    }
  }

  console.log(`Duplicates to remove (${toDelete.length}):`, toDelete);

  if (toDelete.length === 0) {
    console.log("No duplicates found. Nothing deleted.");
    return;
  }

  // 4. Delete duplicates
  const { error: delError } = await supabase
    .from("evaluations")
    .delete()
    .in("id", toDelete);

  if (delError) { console.error("Delete error:", delError); process.exit(1); }

  console.log(`Done. Removed ${toDelete.length} duplicate(s). Backup is at:\n  ${backupPath}`);
}

run();
