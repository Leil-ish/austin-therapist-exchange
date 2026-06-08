/**
 * Applies the referral-logging migration to your Supabase project.
 *
 * Usage (two options):
 *
 * Option A — paste the SQL into your Supabase dashboard:
 *   1. Go to https://supabase.com/dashboard/project/mlwdnvjzdnbmoveuccud/sql/new
 *   2. Paste the contents of supabase/migrations/20260608_referral-logging.sql
 *   3. Click "Run"
 *
 * Option B — run this script (requires your DB password):
 *   DB_PASSWORD=your_password node scripts/apply-referral-migration.mjs
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const password = process.env.DB_PASSWORD;

if (!password) {
  console.log(`
To apply the migration, choose one of these options:

━━ Option A: Supabase Dashboard (recommended) ━━━━━━━━━━━━━━━━━━
1. Open: https://supabase.com/dashboard/project/mlwdnvjzdnbmoveuccud/sql/new
2. Paste and run the SQL below:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  const sql = readFileSync(
    join(__dirname, "../supabase/migrations/20260608_referral-logging.sql"),
    "utf8"
  );
  console.log(sql);
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━ Option B: Run this script with your DB password ━━━━━━━━━━━━━
  DB_PASSWORD=your_db_password node scripts/apply-referral-migration.mjs
(Find your password at: Dashboard → Project Settings → Database)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  process.exit(0);
}

const sqlFile = join(__dirname, "../supabase/migrations/20260608_referral-logging.sql");
const connStr = `postgresql://postgres.mlwdnvjzdnbmoveuccud:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

try {
  execSync(`psql "${connStr}?sslmode=require" -f "${sqlFile}"`, { stdio: "inherit" });
  console.log("\n✓ Migration applied successfully.");
} catch {
  // Try direct connection fallback
  const direct = `postgresql://postgres:${password}@db.mlwdnvjzdnbmoveuccud.supabase.co:5432/postgres`;
  execSync(`psql "${direct}?sslmode=require" -f "${sqlFile}"`, { stdio: "inherit" });
  console.log("\n✓ Migration applied successfully (direct connection).");
}
