import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  const u = (await db.execute(sql`SELECT id, email, cards_tokens FROM users WHERE email='antoine@quivr.app'`)) as unknown as { rows?: { id: number; email: string; cards_tokens: number }[] };
  const user = ((u.rows ?? u) as unknown as { id: number; email: string; cards_tokens: number }[])[0];
  console.log("user:", user);
  const userId = user.id;
  const cards = (await db.execute(sql`SELECT a.slug, uc.count FROM user_cards uc JOIN animals a ON a.id=uc.animal_id WHERE user_id=${userId}`)) as unknown as { rows?: unknown[] };
  console.log("animal cards:", cards.rows ?? cards);
  const pcards = (await db.execute(sql`SELECT p.slug, upc.count FROM user_pokemon_cards upc JOIN pokemon p ON p.id=upc.pokemon_id WHERE user_id=${userId}`)) as unknown as { rows?: unknown[] };
  console.log("pokemon cards:", pcards.rows ?? pcards);
  const shards = (await db.execute(sql`SELECT * FROM user_shards WHERE user_id=${userId}`)) as unknown as { rows?: unknown[] };
  console.log("shards:", shards.rows ?? shards);
}
main().catch(console.error);
