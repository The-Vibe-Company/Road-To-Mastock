import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

const ASSISTED = [
  { name: "Tractions assistées", muscleGroups: ["Dos"] },
  { name: "Dips assistés", muscleGroups: ["Pectoraux", "Triceps"] },
];

async function main() {
  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);
  for (const ex of ASSISTED) {
    const groupsLiteral = `{${ex.muscleGroups.map((g) => `"${g.replace(/"/g, '\\"')}"`).join(",")}}`;
    const r = (await db.execute(sql`
      INSERT INTO exercises (name, kind, is_assisted, muscle_group, muscle_groups)
      VALUES (${ex.name}, 'muscu', TRUE, ${ex.muscleGroups[0]}, ${groupsLiteral}::text[])
      ON CONFLICT (name) DO UPDATE
        SET is_assisted = TRUE,
            kind = 'muscu',
            muscle_group = EXCLUDED.muscle_group,
            muscle_groups = EXCLUDED.muscle_groups
      RETURNING id, name, is_assisted
    `)) as unknown as { rows?: { id: number; name: string; is_assisted: boolean }[] };
    const row = ((r.rows ?? r) as unknown as { id: number; name: string; is_assisted: boolean }[])[0];
    console.log(`  ✓ ${row.name} (id=${row.id}, is_assisted=${row.is_assisted})`);
  }
  console.log("done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
