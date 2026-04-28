/**
 * Scans public/cards/animals/*.png and sets image_url for matching animals.
 * Run after generate-cards.py finishes a batch.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

config({ path: ".env.local" });

async function main() {
  const dir = join(process.cwd(), "public", "cards", "animals");
  if (!existsSync(dir)) {
    console.log("No images dir yet, nothing to sync.");
    return;
  }

  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  const files = readdirSync(dir).filter((f) => f.endsWith(".png"));
  console.log(`Found ${files.length} PNGs. Syncing image_url in DB...`);

  let updated = 0;
  for (const f of files) {
    const slug = f.replace(/\.png$/, "");
    const imageUrl = `/cards/animals/${f}`;
    const result = await db.execute(sql`
      UPDATE animals SET image_url = ${imageUrl} WHERE slug = ${slug}
    `);
    if ((result as unknown as { rowCount?: number }).rowCount) updated++;
  }

  console.log(`Updated ${updated} image_url entries in DB.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
