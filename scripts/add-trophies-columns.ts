import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

// Le cabinet de trophées. Additif et idempotent.
async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  await db.execute(sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS announced_trophies text,
      ADD COLUMN IF NOT EXISTS banner_category text,
      ADD COLUMN IF NOT EXISTS banner_card_id integer
  `);
  console.log("Colonnes trophées en place.");
}
main();
