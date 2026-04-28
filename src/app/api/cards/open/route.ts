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

// Debug mode (set in .env.local for testing — leave unset in prod):
//   CARDS_DEBUG_FORCE_ANIMAL_SLUG=domestic-cat
//   CARDS_DEBUG_FORCE_POKEMON_SLUG=pikachu
//   CARDS_DEBUG_FREE_TOKENS=true
const DEBUG_FORCE_ANIMAL = process.env.CARDS_DEBUG_FORCE_ANIMAL_SLUG;
const DEBUG_FORCE_POKEMON = process.env.CARDS_DEBUG_FORCE_POKEMON_SLUG;
const DEBUG_FREE_TOKENS = process.env.CARDS_DEBUG_FREE_TOKENS === "true";

// POST: spends 1 token to open a pack. First rolls category (75% animal /
// 25% pokemon), then rarity, then a random creature in that pool.
export async function POST() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Spend 1 token (skip if debug free tokens)
  let tokensRemaining: number;
  if (DEBUG_FREE_TOKENS) {
    const [u] = await db
      .select({ tokens: users.cardsTokens })
      .from(users)
      .where(eq(users.id, auth.userId));
    tokensRemaining = u?.tokens ?? 0;
  } else {
    const [decremented] = await db
      .update(users)
      .set({ cardsTokens: sql`${users.cardsTokens} - 1` })
      .where(and(eq(users.id, auth.userId), sql`${users.cardsTokens} >= 1`))
      .returning({ tokens: users.cardsTokens });
    if (!decremented) {
      return Response.json({ error: "Pas de jeton disponible" }, { status: 400 });
    }
    tokensRemaining = decremented.tokens;
  }

  // Determine category
  let category: "animal" | "pokemon";
  if (DEBUG_FORCE_ANIMAL) category = "animal";
  else if (DEBUG_FORCE_POKEMON) category = "pokemon";
  else category = Math.random() < POKEMON_PROBABILITY ? "pokemon" : "animal";

  if (category === "animal") {
    let picked;
    if (DEBUG_FORCE_ANIMAL) {
      [picked] = await db
        .select()
        .from(animals)
        .where(eq(animals.slug, DEBUG_FORCE_ANIMAL));
      if (!picked) {
        await refund(auth.userId);
        return Response.json(
          { error: `Debug slug not found: ${DEBUG_FORCE_ANIMAL}` },
          { status: 500 },
        );
      }
    } else {
      const rarity = rollRarity();
      const candidates = await db.select().from(animals).where(eq(animals.rarity, rarity));
      if (candidates.length === 0) {
        await refund(auth.userId);
        return Response.json({ error: `No animals for rarity ${rarity}` }, { status: 500 });
      }
      picked = candidates[Math.floor(Math.random() * candidates.length)];
    }
    const rarity = picked.rarity as "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

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
      tokens: tokensRemaining,
    });
  }

  // pokemon
  let picked;
  if (DEBUG_FORCE_POKEMON) {
    [picked] = await db
      .select()
      .from(pokemon)
      .where(eq(pokemon.slug, DEBUG_FORCE_POKEMON));
    if (!picked) {
      await refund(auth.userId);
      return Response.json(
        { error: `Debug slug not found: ${DEBUG_FORCE_POKEMON}` },
        { status: 500 },
      );
    }
  } else {
    const rarity = rollRarity();
    const candidates = await db.select().from(pokemon).where(eq(pokemon.rarity, rarity));
    if (candidates.length === 0) {
      await refund(auth.userId);
      return Response.json({ error: `No pokemon for rarity ${rarity}` }, { status: 500 });
    }
    picked = candidates[Math.floor(Math.random() * candidates.length)];
  }
  const rarity = picked.rarity as "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

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
    tokens: tokensRemaining,
  });
}

async function refund(userId: number) {
  if (DEBUG_FREE_TOKENS) return;
  await db
    .update(users)
    .set({ cardsTokens: sql`${users.cardsTokens} + 1` })
    .where(eq(users.id, userId));
}
