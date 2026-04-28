import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { join } from "node:path";

config({ path: ".env.local" });

interface PokemonEntry {
  slug: string;
  name: string;
  rarity: string;
  pokedexNumber: number;
  primaryType: string | null;
  secondaryType: string | null;
  imageUrl: string | null;
}

async function main() {
  const path = join(process.cwd(), "data", "pokemon.json");
  const data: PokemonEntry[] = JSON.parse(readFileSync(path, "utf-8"));

  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  console.log(`Seeding ${data.length} Pokémon...`);
  for (const p of data) {
    // image_url left NULL on insert; the artwork download script populates it
    // (and we don't overwrite it on conflict so re-running the seed is safe)
    await db.execute(sql`
      INSERT INTO pokemon (slug, name, rarity, pokedex_number, primary_type, secondary_type, image_url)
      VALUES (
        ${p.slug},
        ${p.name},
        ${p.rarity},
        ${p.pokedexNumber},
        ${p.primaryType},
        ${p.secondaryType},
        NULL
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        rarity = EXCLUDED.rarity,
        pokedex_number = EXCLUDED.pokedex_number,
        primary_type = EXCLUDED.primary_type,
        secondary_type = EXCLUDED.secondary_type
    `);
  }
  console.log(`Done. ${data.length} Pokémon upserted.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
