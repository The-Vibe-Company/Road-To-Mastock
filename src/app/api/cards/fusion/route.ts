import { db } from "@/lib/db";
import { animals, userCards, userShards } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { FUSION_COST, FUSION_NEXT, RARITIES, type Rarity } from "@/lib/rarities";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const fromRarity = body.fromRarity as Rarity | undefined;

  if (!fromRarity || !RARITIES.includes(fromRarity)) {
    return Response.json({ error: "Invalid rarity" }, { status: 400 });
  }
  const targetRarity = FUSION_NEXT[fromRarity];
  if (!targetRarity) {
    return Response.json(
      { error: "Mythic shards cannot be fused" },
      { status: 400 },
    );
  }

  // Atomic decrement: only succeed if user has enough shards
  const [decremented] = await db
    .update(userShards)
    .set({ count: sql`${userShards.count} - ${FUSION_COST}` })
    .where(
      and(
        eq(userShards.userId, auth.userId),
        eq(userShards.rarity, fromRarity),
        sql`${userShards.count} >= ${FUSION_COST}`,
      ),
    )
    .returning();

  if (!decremented) {
    return Response.json(
      { error: `Pas assez de fragments ${fromRarity}` },
      { status: 400 },
    );
  }

  const candidates = await db
    .select()
    .from(animals)
    .where(eq(animals.rarity, targetRarity));

  if (candidates.length === 0) {
    // Roll back the shard decrement
    await db
      .update(userShards)
      .set({ count: sql`${userShards.count} + ${FUSION_COST}` })
      .where(and(eq(userShards.userId, auth.userId), eq(userShards.rarity, fromRarity)));
    return Response.json(
      { error: `No animals seeded for rarity ${targetRarity}` },
      { status: 500 },
    );
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
      .values({ userId: auth.userId, rarity: targetRarity, count: 1 })
      .onConflictDoUpdate({
        target: [userShards.userId, userShards.rarity],
        set: { count: sql`${userShards.count} + 1` },
      });
    shardsGranted = 1;
  }

  return Response.json({
    animal: picked,
    isDuplicate,
    shardsGranted,
    rarity: targetRarity,
  });
}
