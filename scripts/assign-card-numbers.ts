/**
 * Assigns card numbers 1-1000 to animals. Distribution:
 *   common    1-500
 *   uncommon  501-750
 *   rare      751-900
 *   epic      901-950
 *   legendary 951-985
 *   mythic    986-1000
 *
 * Within a tier, numbers are assigned alphabetically by slug (stable, idempotent).
 *
 * Run: npx tsx scripts/assign-card-numbers.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local" });

const RANGES: Record<string, [number, number]> = {
  common: [1, 500],
  uncommon: [501, 750],
  rare: [751, 900],
  epic: [901, 950],
  legendary: [951, 985],
  mythic: [986, 1000],
};

async function main() {
  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  let total = 0;
  for (const [rarity, [start, end]] of Object.entries(RANGES)) {
    const rows = (await db.execute(sql`
      SELECT id, slug FROM animals WHERE rarity = ${rarity} ORDER BY slug ASC
    `)) as unknown as { rows?: { id: number; slug: string }[] };
    const list = (rows.rows ?? rows) as unknown as { id: number; slug: string }[];

    if (list.length > end - start + 1) {
      console.warn(
        `  ${rarity}: ${list.length} entries but range only fits ${end - start + 1}; trailing ones get NULL`,
      );
    }

    for (let i = 0; i < list.length; i++) {
      const cardNumber = start + i;
      if (cardNumber > end) {
        await db.execute(
          sql`UPDATE animals SET card_number = NULL WHERE id = ${list[i].id}`,
        );
      } else {
        await db.execute(
          sql`UPDATE animals SET card_number = ${cardNumber} WHERE id = ${list[i].id}`,
        );
      }
    }
    console.log(`  ${rarity}: ${list.length} entries → card_number ${start}-${Math.min(end, start + list.length - 1)}`);
    total += list.length;
  }

  console.log(`Assigned card numbers to ${total} animals.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
