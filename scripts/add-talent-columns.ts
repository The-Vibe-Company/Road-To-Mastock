import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

// Colonnes des privilèges de Talents. Additif et idempotent.
async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  await db.execute(sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS totem_category text,
      ADD COLUMN IF NOT EXISTS totem_card_id integer,
      ADD COLUMN IF NOT EXISTS title text,
      ADD COLUMN IF NOT EXISTS weekly_goal integer,
      ADD COLUMN IF NOT EXISTS wallpaper_home text,
      ADD COLUMN IF NOT EXISTS wallpaper_session text,
      ADD COLUMN IF NOT EXISTS wallpaper_collection text
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_card_names (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category text NOT NULL,
      card_id integer NOT NULL,
      nickname text NOT NULL,
      UNIQUE(user_id, category, card_id)
    )
  `);
  console.log("Colonnes talents + user_card_names en place.");
}
main();
