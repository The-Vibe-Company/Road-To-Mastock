import { db } from "@/lib/db";
import { animals, userCards, userShards, users } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { rollRarity } from "@/lib/rarities";

// POST: spends 1 token to open a pack. Atomic decrement guards against
// concurrent double-open.
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

  const rarity = rollRarity();
  const candidates = await db
    .select()
    .from(animals)
    .where(eq(animals.rarity, rarity));

  if (candidates.length === 0) {
    // Refund and bail
    await db
      .update(users)
      .set({ cardsTokens: sql`${users.cardsTokens} + 1` })
      .where(eq(users.id, auth.userId));
    return Response.json(
      { error: `No animals seeded for rarity ${rarity}` },
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
      .values({ userId: auth.userId, rarity, count: 1 })
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
    rarity,
    tokens: decremented.tokens,
  });
}
