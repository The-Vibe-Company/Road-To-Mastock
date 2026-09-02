import { db } from "@/lib/db";
import {
  animals,
  pokemon,
  userCards,
  userPokemonCards,
  userShards,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { FUSION_COST, FUSION_NEXT, RARITIES, type Rarity } from "@/lib/rarities";
import { loadCharges, saveCharges } from "@/lib/guardians";
import { talentOf } from "@/lib/talents";

type Category = "animal" | "pokemon";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const fromRarity = body.fromRarity as Rarity | undefined;
  const category = (body.category as Category | undefined) ?? "animal";

  if (!fromRarity || !RARITIES.includes(fromRarity)) {
    return Response.json({ error: "Invalid rarity" }, { status: 400 });
  }
  if (category !== "animal" && category !== "pokemon") {
    return Response.json({ error: "Invalid category" }, { status: 400 });
  }
  const targetRarity = FUSION_NEXT[fromRarity];
  if (!targetRarity) {
    return Response.json({ error: "Mythic shards cannot be fused" }, { status: 400 });
  }

  // La fusion coûte toujours 3 fragments — la jauge de Forge, elle, paie
  // la Roue de la Forge (voir /api/cards/forge).
  const cost = FUSION_COST;

  // Atomic decrement: only succeed if user has enough shards in this category
  const [decremented] = await db
    .update(userShards)
    .set({ count: sql`${userShards.count} - ${cost}` })
    .where(
      and(
        eq(userShards.userId, auth.userId),
        eq(userShards.rarity, fromRarity),
        eq(userShards.category, category),
        sql`${userShards.count} >= ${cost}`,
      ),
    )
    .returning();

  if (!decremented) {
    return Response.json({ error: `Pas assez de fragments ${fromRarity}` }, { status: 400 });
  }

  if (category === "animal") {
    const candidates = await db.select().from(animals).where(eq(animals.rarity, targetRarity));
    if (candidates.length === 0) {
      await refundShards(auth.userId, fromRarity, category, cost);
      return Response.json({ error: `No animals for rarity ${targetRarity}` }, { status: 500 });
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
        .values({ userId: auth.userId, rarity: targetRarity, category: "animal", count: 1 })
        .onConflictDoUpdate({
          target: [userShards.userId, userShards.rarity, userShards.category],
          set: { count: sql`${userShards.count} + 1` },
        });
      shardsGranted = 1;
    }

    const talent = !isDuplicate ? talentOf("animal", picked.slug) : null;
    return Response.json({
      category,
      rarity: targetRarity,
      creature: { ...picked, kind: "animal" },
      isDuplicate,
      shardsGranted,
      talent: talent
        ? { id: talent.id, family: talent.family, name: talent.name, description: talent.description }
        : null,
    });
  }

  // pokemon
  const candidates = await db.select().from(pokemon).where(eq(pokemon.rarity, targetRarity));
  if (candidates.length === 0) {
    await refundShards(auth.userId, fromRarity, category, cost);
    return Response.json({ error: `No pokemon for rarity ${targetRarity}` }, { status: 500 });
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
      .values({ userId: auth.userId, rarity: targetRarity, category: "pokemon", count: 1 })
      .onConflictDoUpdate({
        target: [userShards.userId, userShards.rarity, userShards.category],
        set: { count: sql`${userShards.count} + 1` },
      });
    shardsGranted = 1;
  }

  const talent = !isDuplicate ? talentOf("pokemon", picked.slug) : null;
  return Response.json({
    category,
    rarity: targetRarity,
    creature: { ...picked, kind: "pokemon" },
    isDuplicate,
    shardsGranted,
    talent: talent
      ? { id: talent.id, family: talent.family, name: talent.name, description: talent.description }
      : null,
  });
}

async function refundShards(userId: number, rarity: Rarity, category: Category, cost: number = FUSION_COST) {
  await db
    .update(userShards)
    .set({ count: sql`${userShards.count} + ${cost}` })
    .where(
      and(
        eq(userShards.userId, userId),
        eq(userShards.rarity, rarity),
        eq(userShards.category, category),
      ),
    );
}
