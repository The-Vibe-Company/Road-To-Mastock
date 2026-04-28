/**
 * Downloads each Pokémon's official artwork from PokeAPI to
 * public/cards/pokemon/{slug}.png and updates image_url in DB.
 *
 * Idempotent: skips already-downloaded files.
 *
 * Run: npx tsx scripts/download-pokemon-artwork.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

config({ path: ".env.local" });

interface PokemonEntry {
  slug: string;
  imageUrl: string | null;
}

async function pLimit<T>(items: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const dataPath = join(process.cwd(), "data", "pokemon.json");
  const entries: PokemonEntry[] = JSON.parse(readFileSync(dataPath, "utf-8"));

  const outDir = join(process.cwd(), "public", "cards", "pokemon");
  mkdirSync(outDir, { recursive: true });

  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  let dbUpdated = 0;

  await pLimit(entries, 8, async (p) => {
    const out = join(outDir, `${p.slug}.png`);
    const localUrl = `/cards/pokemon/${p.slug}.png`;

    if (existsSync(out)) {
      skipped++;
    } else if (!p.imageUrl) {
      failed++;
      console.warn(`  no artwork URL for ${p.slug}`);
      return;
    } else {
      try {
        const r = await fetch(p.imageUrl);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const buf = Buffer.from(await r.arrayBuffer());
        writeFileSync(out, buf);
        downloaded++;
      } catch (e) {
        failed++;
        console.warn(`  failed ${p.slug}: ${e}`);
        return;
      }
    }

    // Update DB
    const result = await db.execute(sql`
      UPDATE pokemon SET image_url = ${localUrl} WHERE slug = ${p.slug}
    `);
    if ((result as unknown as { rowCount?: number }).rowCount) dbUpdated++;
  });

  console.log(`Downloaded ${downloaded}, skipped ${skipped} (already present), failed ${failed}.`);
  console.log(`DB image_url updated for ${dbUpdated} entries.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
