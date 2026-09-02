import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local" });

// La Magnésie : la poudre qui délie les Gardiens. Idempotent.
async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  await db.execute(sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS magnesie integer NOT NULL DEFAULT 0
  `);
  console.log("colonne users.magnesie prête");
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
