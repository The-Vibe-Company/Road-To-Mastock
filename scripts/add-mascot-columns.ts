import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

// Ajoute les deux colonnes de mascotte sur `exercises`. Additif et idempotent :
// rejouable sans risque, et `drizzle-kit push` n'aura plus rien à proposer.
async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));

  await db.execute(sql`
    ALTER TABLE exercises
      ADD COLUMN IF NOT EXISTS mascot_animal_id integer
        REFERENCES animals(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS mascot_pokemon_id integer
        REFERENCES pokemon(id) ON DELETE SET NULL
  `);

  const res = (await db.execute(sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'exercises'
      AND column_name IN ('mascot_animal_id', 'mascot_pokemon_id')
    ORDER BY column_name
  `)) as unknown as { rows?: Record<string, string>[] };

  const rows = (res.rows ?? res) as unknown as Record<string, string>[];
  console.log("Colonnes en place :");
  for (const r of rows) {
    console.log(`  · ${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`);
  }
}

main();
