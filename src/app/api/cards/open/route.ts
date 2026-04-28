import { db } from "@/lib/db";
import {
  animals,
  pokemon,
  userCards,
  userPokemonCards,
  userShards,
  users,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { rollRarity } from "@/lib/rarities";

const POKEMON_PROBABILITY = 0.25;

// POST: spends 1 token to open a pack. First rolls category (75% animal /
// 25% pokemon), then rarity, then a random creature in that pool.
export async function POST() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Atomic spend: only succeed if user has at least 1 token
  const [decremented] = await db
    .update(users)
    .set({ cardsTokens: sql`${users.cardsTokens} - 1` })
    .where(and(eq(users.id, auth.userId), sql`${users.cardsTokens} >= 1`))
    .returning({ tokens: users.cardsTokens });

  if (!decremented) {
    return Response.json({ error: "Pas de jeton disponible" }, { status: 400 });
  }

  const category: "animal" | "pokemon" =
    Math.random() < POKEMON_PROBABILITY ? "pokemon" : "animal";
  const rarity = rollRarity();

  if (category === "animal") {
    const candidates = await db.select().from(animals).where(eq(animals.rarity, rarity));
    if (candidates.length === 0) {
      await refund(auth.userId);
      return Response.json({ error: `No animals for rarity ${rarity}` }, { status: 500 });
    }
    const picked = candidates[Math.floor(Math.random() * candidates.length)];

    const [card] = await db
      .insert(userCards)
      .values({ userId: auth.userId, animalId: picked.id, count: 1 })
      .onConflictDoUpdate({
        target: [userCards.userId, userCards.animalId],
        set: { count: sql`${userCards.count} + 1` },
      })
      .returning();

    const isDuplicate = (card?.count ?? 1) > 1;
    let shardsGranted = 0;
    if (isDuplicate) {
      await db
        .insert(userShards)
        .values({ userId: auth.userId, rarity, category: "animal", count: 1 })
        .onConflictDoUpdate({
          target: [userShards.userId, userShards.rarity, userShards.category],
          set: { count: sql`${userShards.count} + 1` },
        });
      shardsGranted = 1;
    }

    return Response.json({
      category,
      rarity,
      creature: { ...picked, kind: "animal" },
      isDuplicate,
      shardsGranted,
      tokens: decremented.tokens,
    });
  }

  // pokemon
  const candidates = await db.select().from(pokemon).where(eq(pokemon.rarity, rarity));
  if (candidates.length === 0) {
    await refund(auth.userId);
    return Response.json({ error: `No pokemon for rarity ${rarity}` }, { status: 500 });
  }
  const picked = candidates[Math.floor(Math.random() * candidates.length)];

  const [card] = await db
    .insert(userPokemonCards)
    .values({ userId: auth.userId, pokemonId: picked.id, count: 1 })
    .onConflictDoUpdate({
      target: [userPokemonCards.userId, userPokemonCards.pokemonId],
      set: { count: sql`${userPokemonCards.count} + 1` },
    })
    .returning();

  const isDuplicate = (card?.count ?? 1) > 1;
  let shardsGranted = 0;
  if (isDuplicate) {
    await db
      .insert(userShards)
      .values({ userId: auth.userId, rarity, category: "pokemon", count: 1 })
      .onConflictDoUpdate({
        target: [userShards.userId, userShards.rarity, userShards.category],
        set: { count: sql`${userShards.count} + 1` },
      });
    shardsGranted = 1;
  }

  return Response.json({
    category,
    rarity,
    creature: { ...picked, kind: "pokemon" },
    isDuplicate,
    shardsGranted,
    tokens: decremented.tokens,
  });
}

async function refund(userId: number) {
  await db
    .update(users)
    .set({ cardsTokens: sql`${users.cardsTokens} + 1` })
    .where(eq(users.id, userId));
}
