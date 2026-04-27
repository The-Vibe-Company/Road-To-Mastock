import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { animals } from "./schema";
import { ANIMALS } from "../animals/data";

config({ path: ".env.local" });

async function seed() {
  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  console.log(`Seeding ${ANIMALS.length} animals...`);

  for (const a of ANIMALS) {
    // image_url is left NULL on insert; the Phylopic download script
    // (or manual upload) is what sets it. Re-running the seed must not
    // wipe images, hence we don't update image_url on conflict.
    await db.execute(sql`
      INSERT INTO animals (slug, name, rarity, scientific_name, image_url, description)
      VALUES (
        ${a.slug},
        ${a.name},
        ${a.rarity},
        ${a.scientificName ?? null},
        NULL,
        ${a.description ?? null}
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        rarity = EXCLUDED.rarity,
        scientific_name = EXCLUDED.scientific_name,
        description = EXCLUDED.description
    `);
  }

  console.log(`Done. ${ANIMALS.length} animals upserted.`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
