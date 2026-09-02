import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

// Fondations du système de gardiens. Additif et idempotent.
async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));

  await db.execute(sql`ALTER TABLE animals ADD COLUMN IF NOT EXISTS lineage text`);
  await db.execute(sql`
    ALTER TABLE exercises
      ADD COLUMN IF NOT EXISTS mascot_triggers integer NOT NULL DEFAULT 0
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_charges (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      direction text NOT NULL,
      points integer NOT NULL DEFAULT 0,
      UNIQUE(user_id, direction)
    )
  `);
  console.log("Colonnes et table user_charges en place.");
}
main();
