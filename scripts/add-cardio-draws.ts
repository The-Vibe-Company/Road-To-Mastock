import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local" });

// L'Échappée : les cartes tirées par le cardio, en attente de placement
// (attractif/répulsif) dans la cérémonie de clôture. Idempotent.
async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS session_cardio_draws (
      id serial PRIMARY KEY,
      session_id integer NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      card_category text NOT NULL,
      card_id integer NOT NULL,
      mode text,
      resolved_at timestamptz,
      created_at timestamptz DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS session_cardio_draws_session_idx
      ON session_cardio_draws(session_id)
  `);
  console.log("table session_cardio_draws prête");
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
