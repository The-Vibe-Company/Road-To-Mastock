import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

// Le lien du Gardien : date de pose. Additif et idempotent. Les mascottes
// déjà posées gardent NULL = déliées (droit acquis).
async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  await db.execute(sql`
    ALTER TABLE exercises
      ADD COLUMN IF NOT EXISTS mascot_assigned_at timestamptz
  `);
  console.log("Colonne mascot_assigned_at en place.");
}
main();
