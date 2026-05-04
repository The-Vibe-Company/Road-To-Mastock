/**
 * Backfill sessions.bodyweight_kg for existing users so that future
 * assisted-exercise stats start from a known baseline. Per Antoine:
 *   antoine@quivr.app : 86 kg
 *   stan@quivr.app    : 112 kg
 *
 * Only fills sessions where bodyweight_kg IS NULL — does not overwrite
 * any explicit entry.
 *
 * Usage:
 *   npx tsx scripts/backfill-bodyweight.ts [--write]
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

const TARGETS: { email: string; bodyweightKg: number }[] = [
  { email: "antoine@quivr.app", bodyweightKg: 86 },
  { email: "stan@quivr.app", bodyweightKg: 112 },
];

async function main() {
  const write = process.argv.includes("--write");
  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  console.log(`Mode: ${write ? "✏️  WRITE" : "🔍 DRY RUN"}`);

  for (const { email, bodyweightKg } of TARGETS) {
    const u = (await db.execute(sql`
      SELECT id, name FROM users WHERE email = ${email}
    `)) as unknown as { rows?: { id: number; name: string }[] };
    const user = ((u.rows ?? u) as unknown as { id: number; name: string }[])[0];
    if (!user) {
      console.log(`  · ${email}: aucun compte trouvé`);
      continue;
    }
    const c = (await db.execute(sql`
      SELECT COUNT(*)::int AS n
      FROM sessions
      WHERE user_id = ${user.id} AND bodyweight_kg IS NULL
    `)) as unknown as { rows?: { n: number }[] };
    const n = ((c.rows ?? c) as unknown as { n: number }[])[0]?.n ?? 0;
    console.log(`  · ${user.name} <${email}> (id=${user.id}) : ${n} session(s) à remplir → ${bodyweightKg} kg`);
    if (write && n > 0) {
      await db.execute(sql`
        UPDATE sessions
        SET bodyweight_kg = ${bodyweightKg}
        WHERE user_id = ${user.id} AND bodyweight_kg IS NULL
      `);
      console.log(`    ✓ ${n} session(s) mises à jour`);
    }
  }
  if (!write) console.log("\n🔍 Dry-run only. Re-run with --write to apply.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
