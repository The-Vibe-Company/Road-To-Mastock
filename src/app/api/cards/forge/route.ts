import { db } from "@/lib/db";
import { userShards } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { loadCharges, saveCharges } from "@/lib/guardians";
import { FORGE_WHEEL_COST, drawForgeFragment } from "@/lib/powers";

// La Roue de la Forge : 10 points de Forge contre un fragment garanti,
// dont la rareté se joue aux pourcentages (40 % commun → 1 % mythique).
export async function POST() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const charges = await loadCharges(auth.userId);
  if ((charges.forge ?? 0) < FORGE_WHEEL_COST) {
    return Response.json(
      { error: `La Forge n'est pas pleine — ${charges.forge ?? 0}/${FORGE_WHEEL_COST}` },
      { status: 400 },
    );
  }

  charges.forge = (charges.forge ?? 0) - FORGE_WHEEL_COST;
  await saveCharges(auth.userId, charges);

  const rarity = drawForgeFragment();
  const category = Math.random() < 0.5 ? "animal" : "pokemon";
  await db
    .insert(userShards)
    .values({ userId: auth.userId, rarity, category, count: 1 })
    .onConflictDoUpdate({
      target: [userShards.userId, userShards.rarity, userShards.category],
      set: { count: sql`${userShards.count} + 1` },
    });

  return Response.json({ rarity, category, forge: charges.forge });
}
