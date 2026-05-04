import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

const PROMOTE_TO_ASSISTED = ["Traction assiste", "Dips assist"];
const SEED_DUPES = ["Tractions assistées", "Dips assistés"];

async function main() {
  const write = process.argv.includes("--write");
  const db = drizzle(neon(process.env.DATABASE_URL!));
  console.log(`Mode: ${write ? "✏️  WRITE" : "🔍 DRY RUN"}`);

  // 1. Promote user-created exercises to is_assisted=true
  for (const name of PROMOTE_TO_ASSISTED) {
    const before = (await db.execute(sql`
      SELECT id, name, is_assisted FROM exercises WHERE name = ${name}
    `)) as unknown as { rows?: { id: number; name: string; is_assisted: boolean }[] };
    const row = ((before.rows ?? before) as unknown as { id: number; name: string; is_assisted: boolean }[])[0];
    if (!row) {
      console.log(`  · "${name}" introuvable, skip`);
      continue;
    }
    console.log(`  · ${row.name} (id=${row.id}) is_assisted=${row.is_assisted} → true`);
    if (write && !row.is_assisted) {
      await db.execute(sql`UPDATE exercises SET is_assisted = TRUE WHERE id = ${row.id}`);
    }
  }

  // 2. Delete seed dupes if no session_exercises reference them
  for (const name of SEED_DUPES) {
    const ex = (await db.execute(sql`
      SELECT id FROM exercises WHERE name = ${name}
    `)) as unknown as { rows?: { id: number }[] };
    const row = ((ex.rows ?? ex) as unknown as { id: number }[])[0];
    if (!row) {
      console.log(`  · "${name}" introuvable, skip`);
      continue;
    }
    const refs = (await db.execute(sql`
      SELECT COUNT(*)::int AS n FROM session_exercises WHERE exercise_id = ${row.id}
    `)) as unknown as { rows?: { n: number }[] };
    const n = ((refs.rows ?? refs) as unknown as { n: number }[])[0]?.n ?? 0;
    if (n > 0) {
      console.log(`  · "${name}" (id=${row.id}) référencé par ${n} session(s) → on garde`);
      continue;
    }
    console.log(`  · "${name}" (id=${row.id}) sans référence → supprime`);
    if (write) {
      await db.execute(sql`DELETE FROM exercises WHERE id = ${row.id}`);
    }
  }

  if (!write) console.log("\n🔍 Dry-run only. Re-run with --write to apply.");
}

main().catch((e) => { console.error(e); process.exit(1); });
