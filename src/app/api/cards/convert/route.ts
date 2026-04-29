import { db } from "@/lib/db";
import { userShards, users } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { CONVERSION_BATCH, CONVERSION_RATE, type Rarity } from "@/lib/rarities";
import { RARITIES } from "@/lib/rarities";

type Category = "animal" | "pokemon";

// POST: convert fragments of a given rarity (and category) into tokens.
// Body: { rarity: Rarity, category: 'animal' | 'pokemon' }
// Always converts CONVERSION_BATCH[rarity] fragments → CONVERSION_RATE[rarity] tokens.
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const rarity = body.rarity as Rarity | undefined;
  const category = body.category as Category | undefined;

  if (!rarity || !RARITIES.includes(rarity)) {
    return Response.json({ error: "Invalid rarity" }, { status: 400 });
  }
  if (category !== "animal" && category !== "pokemon") {
    return Response.json({ error: "Invalid category" }, { status: 400 });
  }

  const batch = CONVERSION_BATCH[rarity];
  const reward = CONVERSION_RATE[rarity];

  // Atomic decrement: only succeed if user has enough shards
  const [decremented] = await db
    .update(userShards)
    .set({ count: sql`${userShards.count} - ${batch}` })
    .where(
      and(
        eq(userShards.userId, auth.userId),
        eq(userShards.rarity, rarity),
        eq(userShards.category, category),
        sql`${userShards.count} >= ${batch}`,
      ),
    )
    .returning();

  if (!decremented) {
    return Response.json(
      { error: `Pas assez de fragments (besoin de ${batch})` },
      { status: 400 },
    );
  }

  const [updatedUser] = await db
    .update(users)
    .set({ cardsTokens: sql`${users.cardsTokens} + ${reward}` })
    .where(eq(users.id, auth.userId))
    .returning({ tokens: users.cardsTokens });

  return Response.json({
    consumed: batch,
    granted: reward,
    rarity,
    category,
    tokens: updatedUser?.tokens ?? 0,
  });
}
