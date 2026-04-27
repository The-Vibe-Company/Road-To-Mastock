import { db } from "@/lib/db";
import { animals, userCards, userShards, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { RARITIES, type Rarity } from "@/lib/rarities";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await db
    .select({
      animalId: userCards.animalId,
      count: userCards.count,
      firstObtainedAt: userCards.firstObtainedAt,
      slug: animals.slug,
      name: animals.name,
      rarity: animals.rarity,
      scientificName: animals.scientificName,
      imageUrl: animals.imageUrl,
      description: animals.description,
    })
    .from(userCards)
    .innerJoin(animals, eq(userCards.animalId, animals.id))
    .where(eq(userCards.userId, auth.userId));

  const totals = await db
    .select({
      rarity: animals.rarity,
      total: animals.id,
    })
    .from(animals);

  const totalsByRarity: Record<Rarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0,
  };
  for (const a of totals) {
    if (RARITIES.includes(a.rarity as Rarity)) {
      totalsByRarity[a.rarity as Rarity]++;
    }
  }

  const shardRows = await db
    .select({ rarity: userShards.rarity, count: userShards.count })
    .from(userShards)
    .where(eq(userShards.userId, auth.userId));

  const shards: Record<Rarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0,
  };
  for (const s of shardRows) {
    if (RARITIES.includes(s.rarity as Rarity)) {
      shards[s.rarity as Rarity] = s.count;
    }
  }

  const [user] = await db
    .select({ tokens: users.cardsTokens })
    .from(users)
    .where(eq(users.id, auth.userId));

  return Response.json({
    cards: owned,
    totalsByRarity,
    shards,
    tokens: user?.tokens ?? 0,
  });
}
