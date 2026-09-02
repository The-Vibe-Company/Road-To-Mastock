import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";
import { readFileSync } from "fs";

config({ path: ".env.local", override: true });

// Applique les lignées de gardiens (classifiées par lot via workflow) sur
// la table animals. Usage: npx tsx scripts/apply-lineages.ts <assignments.json>
async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: apply-lineages.ts <assignments.json>");
  const assignments = JSON.parse(readFileSync(file, "utf-8")) as {
    slug: string;
    lineage: string;
  }[];

  const db = drizzle(neon(process.env.DATABASE_URL!));
  const byLineage = new Map<string, string[]>();
  for (const a of assignments) {
    if (!byLineage.has(a.lineage)) byLineage.set(a.lineage, []);
    byLineage.get(a.lineage)!.push(a.slug);
  }

  for (const [lineage, slugs] of byLineage) {
    const res = (await db.execute(sql`
      UPDATE animals SET lineage = ${lineage}
      WHERE slug IN (${sql.join(slugs.map((s) => sql`${s}`), sql`, `)})
    `)) as unknown as { rowCount?: number };
    console.log(`${lineage}: ${res.rowCount ?? "?"} lignes`);
  }

  const check = (await db.execute(sql`
    SELECT COUNT(*)::int AS missing FROM animals WHERE lineage IS NULL
  `)) as unknown as { rows?: { missing: number }[] };
  const rows = (check.rows ?? check) as unknown as { missing: number }[];
  console.log(`Sans lignée: ${rows[0]?.missing}`);
}
main();
