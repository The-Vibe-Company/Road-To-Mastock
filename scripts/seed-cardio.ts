import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";
import { CARDIO_MACHINES } from "../src/lib/cardio";

config({ path: ".env.local", override: true });

async function main() {
  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  for (const { label } of CARDIO_MACHINES) {
    const r = (await db.execute(sql`
      INSERT INTO exercises (name, kind, muscle_group, muscle_groups)
      VALUES (${label}, 'cardio', 'Cardio', ARRAY['Cardio'])
      ON CONFLICT (name) DO UPDATE
        SET kind = 'cardio',
            muscle_group = 'Cardio',
            muscle_groups = ARRAY['Cardio']
      RETURNING id, name, kind
    `)) as unknown as { rows?: { id: number; name: string; kind: string }[] };
    const row = ((r.rows ?? r) as unknown as { id: number; name: string; kind: string }[])[0];
    console.log(`  ✓ ${row.name} (id=${row.id}, kind=${row.kind})`);
  }
  console.log("done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
