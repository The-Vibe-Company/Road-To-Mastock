/**
 * Pulls FR flavor text + height/weight/habitat from PokeAPI for each Pokémon
 * already seeded in the DB. Idempotent.
 *
 * Run: npx tsx scripts/enrich-pokemon.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local" });

const API = "https://pokeapi.co/api/v2";

interface SpeciesRaw {
  id: number;
  flavor_text_entries: { flavor_text: string; language: { name: string }; version: { name: string } }[];
  habitat: { name: string } | null;
  genera: { genus: string; language: { name: string } }[];
}
interface PokemonRaw {
  id: number;
  height: number; // decimeters
  weight: number; // hectograms
}

// Translate PokeAPI habitat slugs to French
const HABITAT_FR: Record<string, string> = {
  cave: "Grottes",
  forest: "Forêts",
  grassland: "Prairies",
  mountain: "Montagnes",
  rare: "Lieux rares",
  "rough-terrain": "Terrains rocheux",
  sea: "Mers",
  urban: "Zones urbaines",
  "waters-edge": "Bords de l'eau",
};

async function fetchJson<T>(url: string): Promise<T | null> {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return (await r.json()) as T;
      if (r.status === 404) return null;
    } catch {
      // retry
    }
    await new Promise((res) => setTimeout(res, 500 * (i + 1)));
  }
  return null;
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

function pickFrFlavor(species: SpeciesRaw): string | null {
  // Take the first FR flavor text we can find. Replace newlines/form-feeds.
  const fr = species.flavor_text_entries.find((e) => e.language.name === "fr");
  if (!fr) return null;
  return fr.flavor_text.replace(/[\f\n\r]/g, " ").replace(/\s+/g, " ").trim();
}

async function main() {
  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  const rows = (await db.execute(sql`
    SELECT id, pokedex_number FROM pokemon WHERE flavor IS NULL OR height_cm IS NULL OR weight_kg IS NULL
  `)) as unknown as { rows?: { id: number; pokedex_number: number }[] };
  const list = (rows.rows ?? rows) as unknown as { id: number; pokedex_number: number }[];

  console.log(`Enriching ${list.length} Pokémon...`);
  let done = 0;

  await pLimit(list, 8, async ({ id, pokedex_number }) => {
    const [species, poke] = await Promise.all([
      fetchJson<SpeciesRaw>(`${API}/pokemon-species/${pokedex_number}`),
      fetchJson<PokemonRaw>(`${API}/pokemon/${pokedex_number}`),
    ]);

    const flavor = species ? pickFrFlavor(species) : null;
    const heightCm = poke ? poke.height * 10 : null; // dm → cm
    const weightKg = poke ? poke.weight / 10 : null; // hg → kg
    const habitatRaw = species?.habitat?.name ?? null;
    const habitat = habitatRaw ? HABITAT_FR[habitatRaw] ?? habitatRaw : null;

    await db.execute(sql`
      UPDATE pokemon SET
        flavor = ${flavor},
        height_cm = ${heightCm},
        weight_kg = ${weightKg},
        habitat = ${habitat}
      WHERE id = ${id}
    `);

    done++;
    if (done % 50 === 0) console.log(`  enriched ${done}/${list.length}`);
  });

  console.log(`Done. ${done} Pokémon enriched.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
