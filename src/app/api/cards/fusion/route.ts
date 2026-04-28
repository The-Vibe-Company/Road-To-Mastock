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

  // Atomic decrement: only succeed if user has enough shards in this category
  const [decremented] = await db
    .update(userShards)
    .set({ count: sql`${userShards.count} - ${FUSION_COST}` })
    .where(
      and(
        eq(userShards.userId, auth.userId),
        eq(userShards.rarity, fromRarity),
        eq(userShards.category, category),
        sql`${userShards.count} >= ${FUSION_COST}`,
      ),
    )
    .returning();

  if (!decremented) {
    return Response.json({ error: `Pas assez de fragments ${fromRarity}` }, { status: 400 });
  }

  if (category === "animal") {
    const candidates = await db.select().from(animals).where(eq(animals.rarity, targetRarity));
    if (candidates.length === 0) {
      await refundShards(auth.userId, fromRarity, category);
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

    return Response.json({
      category,
      rarity: targetRarity,
      creature: { ...picked, kind: "animal" },
      isDuplicate,
      shardsGranted,
    });
  }

  // pokemon
  const candidates = await db.select().from(pokemon).where(eq(pokemon.rarity, targetRarity));
  if (candidates.length === 0) {
    await refundShards(auth.userId, fromRarity, category);
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

  return Response.json({
    category,
    rarity: targetRarity,
    creature: { ...picked, kind: "pokemon" },
    isDuplicate,
    shardsGranted,
  });
}

async function refundShards(userId: number, rarity: Rarity, category: Category) {
  await db
    .update(userShards)
    .set({ count: sql`${userShards.count} + ${FUSION_COST}` })
    .where(
      and(
        eq(userShards.userId, userId),
        eq(userShards.rarity, rarity),
        eq(userShards.category, category),
      ),
    );
}
