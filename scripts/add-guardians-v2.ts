import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

// Gardiens v2 : polarité, énergie fraîche, miracles hebdomadaires, annonce
// des talents. Additif et idempotent.
async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  await db.execute(sql`
    ALTER TABLE exercises
      ADD COLUMN IF NOT EXISTS mascot_mode text NOT NULL DEFAULT 'attract'
  `);
  await db.execute(sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS announced_talents text
  `);
  await db.execute(sql`
    ALTER TABLE user_charges
      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW()
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_miracle_uses (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      miracle text NOT NULL,
      iso_week date NOT NULL,
      UNIQUE(user_id, miracle, iso_week)
    )
  `);
  console.log("Gardiens v2 : colonnes et table en place.");
}
main();
