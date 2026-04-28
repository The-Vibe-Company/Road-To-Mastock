/**
 * Generates flavor / height / weight / habitat for each animal via Claude API
 * (Haiku 4.5, ~$0.70 total for 1000 entries). Idempotent — only fills rows
 * where flavor IS NULL.
 *
 * Run: npx tsx scripts/enrich-animals.ts
 *
 * Env required: ANTHROPIC_API_KEY in .env.local
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local", override: true });

interface AnimalRow {
  id: number;
  slug: string;
  name: string;
  rarity: string;
  scientific_name: string | null;
  description: string | null;
}

interface Enrichment {
  flavor: string;
  heightCm: number;
  weightKg: number;
  habitat: string;
}

const SYSTEM_PROMPT = `Tu es un encyclopédiste animalier qui rédige les fiches d'une appli de collection de cartes en français. Pour chaque créature, tu produis EXCLUSIVEMENT un objet JSON valide avec ces clés :
- "flavor": 1 à 2 phrases courtes en français (max 200 caractères), ton engageant et imagé, sur le comportement ou un trait remarquable
- "heightCm": longueur/hauteur typique adulte en centimètres (number)
- "weightKg": poids typique adulte en kilogrammes (number, décimal autorisé)
- "habitat": phrase courte en français sur le milieu naturel (ex: "Forêts tempérées d'Europe", "Savanes africaines", "Récifs coralliens du Pacifique")

Pour les créatures mythologiques, donne des chiffres cohérents avec leur lore (ex: phénix ~1m d'envergure, ~5kg) et un habitat poétique.
Réponds UNIQUEMENT avec le JSON, pas de markdown, pas de commentaire.`;

const MODEL = "claude-haiku-4-5";

async function callClaude(apiKey: string, user: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`HTTP ${r.status}: ${body.slice(0, 200)}`);
  }
  const data = (await r.json()) as { content?: { type: string; text?: string }[] };
  const block = data.content?.[0];
  if (!block || block.type !== "text" || !block.text) {
    throw new Error("No text in response");
  }
  return block.text;
}

function buildUserPrompt(a: AnimalRow): string {
  const lines = [
    `Nom français : ${a.name}`,
    a.scientific_name ? `Nom scientifique : ${a.scientific_name}` : null,
    a.description ? `Lore existant : ${a.description}` : null,
    `Rareté : ${a.rarity}`,
  ].filter(Boolean);
  return lines.join("\n");
}

async function enrichOne(apiKey: string, a: AnimalRow): Promise<Enrichment | null> {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const txt = await callClaude(apiKey, buildUserPrompt(a));
      const cleaned = txt
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "");
      const parsed = JSON.parse(cleaned) as Enrichment;
      if (
        typeof parsed.flavor !== "string" ||
        typeof parsed.heightCm !== "number" ||
        typeof parsed.weightKg !== "number" ||
        typeof parsed.habitat !== "string"
      ) {
        throw new Error("invalid schema");
      }
      return parsed;
    } catch (e) {
      if (attempt === 4) {
        console.warn(`  ${a.slug} failed after 4 attempts: ${e}`);
        return null;
      }
      // Backoff harder on rate limits
      const msg = e instanceof Error ? e.message : String(e);
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("rate");
      const delay = isRateLimit ? 3000 * attempt : 700 * attempt;
      await new Promise((r) => setTimeout(r, delay));
    }
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

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY in .env.local");
    process.exit(1);
  }

  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  const result = (await db.execute(sql`
    SELECT id, slug, name, rarity, scientific_name, description
    FROM animals
    WHERE flavor IS NULL
    ORDER BY id ASC
  `)) as unknown as { rows?: AnimalRow[] };
  const list = (result.rows ?? result) as unknown as AnimalRow[];

  console.log(`Enriching ${list.length} animals via ${MODEL}...`);
  let done = 0;
  let ok = 0;
  let failed = 0;

  await pLimit(list, 6, async (a) => {
    const enrichment = await enrichOne(apiKey, a);
    if (enrichment) {
      await db.execute(sql`
        UPDATE animals SET
          flavor = ${enrichment.flavor},
          height_cm = ${enrichment.heightCm},
          weight_kg = ${enrichment.weightKg},
          habitat = ${enrichment.habitat}
        WHERE id = ${a.id}
      `);
      ok++;
    } else {
      failed++;
    }
    done++;
    if (done % 25 === 0) {
      console.log(`  ${done}/${list.length} (ok=${ok} fail=${failed})`);
    }
  });

  console.log(`\nDone. ${ok} enriched, ${failed} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
