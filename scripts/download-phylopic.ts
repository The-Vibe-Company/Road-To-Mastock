/**
 * Downloads silhouette SVGs from Phylopic for animals that have a
 * `scientificName`. Files land in `public/cards/animals/{slug}.svg`.
 * Then upserts each animal's `image_url` in the DB.
 *
 * Phylopic API docs: https://api.phylopic.org/
 *
 * Run: npx tsx scripts/download-phylopic.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { ANIMALS } from "../src/lib/animals/data";

const OUT_DIR = join(process.cwd(), "public", "cards", "animals");
const PHYLOPIC = "https://api.phylopic.org";

interface ResolveResp {
  _links?: {
    primaryImage?: { href: string };
  };
}

interface ImageResp {
  _links?: {
    rasterFiles?: { href: string }[];
    vectorFile?: { href: string };
    sourceFile?: { href: string };
  };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { headers: { "Accept": "application/vnd.phylopic.v2+json" } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

async function fileExists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function resolveImageUrl(scientificName: string): Promise<string | null> {
  // Phylopic resolve endpoint: /resolve/{ns}/{name}
  // Use 'eol.org' or 'biota' name resolution. Simpler: search.
  const search = await fetchJson<{ _embedded?: { primaryImage?: { _links?: { vectorFile?: { href: string } } } } }>(
    `${PHYLOPIC}/resolve/eol.org/pages?text=${encodeURIComponent(scientificName)}&embed_primaryImage=true`,
  );
  const vec = search?._embedded?.primaryImage?._links?.vectorFile?.href;
  if (vec) return vec.startsWith("http") ? vec : `${PHYLOPIC}${vec}`;
  return null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  let downloaded = 0;
  let skipped = 0;
  let missing = 0;

  for (const a of ANIMALS) {
    if (!a.scientificName) {
      missing++;
      continue;
    }
    const out = join(OUT_DIR, `${a.slug}.svg`);
    if (await fileExists(out)) {
      skipped++;
      continue;
    }

    process.stdout.write(`[${a.slug}] resolving... `);
    const url = await resolveImageUrl(a.scientificName);
    if (!url) {
      console.log("not found");
      missing++;
      continue;
    }

    try {
      const r = await fetch(url);
      if (!r.ok) {
        console.log(`HTTP ${r.status}`);
        missing++;
        continue;
      }
      const buf = Buffer.from(await r.arrayBuffer());
      await writeFile(out, buf);

      await db.execute(sql`
        UPDATE animals SET image_url = ${`/cards/animals/${a.slug}.svg`} WHERE slug = ${a.slug}
      `);

      console.log(`ok (${(buf.length / 1024).toFixed(1)} KB)`);
      downloaded++;
    } catch (e) {
      console.log(`error: ${e}`);
      missing++;
    }

    // Be polite with the API
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\nDone. Downloaded ${downloaded}, skipped ${skipped} existing, ${missing} missing.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
