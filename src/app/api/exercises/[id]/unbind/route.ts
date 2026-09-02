import { db } from "@/lib/db";
import { animals, exercises, pokemon, users } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { guardianBondStatus } from "@/lib/guardians";
import { UNBIND_PRICE } from "@/lib/powers";
import type { Rarity } from "@/lib/rarities";

// Le déliement : payer sa magnésie pour libérer un Gardien lié sans
// attendre les 30 jours ni battre de record. Prix au rang de la carte.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const exerciseId = parseInt((await params).id);
  const [ex] = await db
    .select({
      id: exercises.id,
      mascotAnimalId: exercises.mascotAnimalId,
      mascotPokemonId: exercises.mascotPokemonId,
    })
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), eq(exercises.userId, auth.userId)));
  if (!ex) return Response.json({ error: "Exercise not found" }, { status: 404 });
  if (!ex.mascotAnimalId && !ex.mascotPokemonId) {
    return Response.json({ error: "Aucun gardien posé" }, { status: 400 });
  }

  const bond = await guardianBondStatus(exerciseId, auth.userId);
  if (!bond.locked) {
    return Response.json({ error: "Le gardien est déjà libre" }, { status: 400 });
  }

  // Le prix : la rareté du gardien qu'on libère.
  const rarity = ex.mascotAnimalId
    ? (await db.select({ r: animals.rarity }).from(animals).where(eq(animals.id, ex.mascotAnimalId)))[0]?.r
    : (await db.select({ r: pokemon.rarity }).from(pokemon).where(eq(pokemon.id, ex.mascotPokemonId!)))[0]?.r;
  if (!rarity) return Response.json({ error: "Carte introuvable" }, { status: 404 });
  const price = UNBIND_PRICE[rarity as Rarity];

  // Paiement atomique : le solde ne descend jamais sous zéro.
  const paid = await db
    .update(users)
    .set({ magnesie: sql`${users.magnesie} - ${price}` })
    .where(and(eq(users.id, auth.userId), sql`${users.magnesie} >= ${price}`))
    .returning({ magnesie: users.magnesie });
  if (paid.length === 0) {
    return Response.json(
      { error: `Pas assez de magnésie — il en faut ${price}` },
      { status: 400 },
    );
  }

  await db
    .update(exercises)
    .set({
      mascotAnimalId: null,
      mascotPokemonId: null,
      mascotMode: "attract",
      mascotTriggers: 0,
      mascotAssignedAt: null,
    })
    .where(eq(exercises.id, exerciseId));

  return Response.json({ ok: true, price, balance: paid[0].magnesie });
}
