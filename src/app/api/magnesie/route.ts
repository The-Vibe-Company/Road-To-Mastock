import { db } from "@/lib/db";
import { animals, pokemon, userCards, userPokemonCards, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { UNBIND_PRICE, magnesieOf } from "@/lib/powers";
import type { Rarity } from "@/lib/rarities";

// La Magnésie du joueur : son solde, et celles de ses cartes qui la
// portent — pour l'annonce de la nouveauté et les écrans d'inventaire.
export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [u] = await db
    .select({ magnesie: users.magnesie })
    .from(users)
    .where(eq(users.id, auth.userId));

  const ownedAnimals = await db
    .select({ slug: animals.slug, name: animals.name, rarity: animals.rarity, imageUrl: animals.imageUrl })
    .from(userCards)
    .innerJoin(animals, eq(userCards.animalId, animals.id))
    .where(eq(userCards.userId, auth.userId));
  const ownedPokemon = await db
    .select({ slug: pokemon.slug, name: pokemon.name, rarity: pokemon.rarity, imageUrl: pokemon.imageUrl })
    .from(userPokemonCards)
    .innerJoin(pokemon, eq(userPokemonCards.pokemonId, pokemon.id))
    .where(eq(userPokemonCards.userId, auth.userId));

  const carriers = [
    ...ownedAnimals.map((c) => ({ category: "animal" as const, ...c })),
    ...ownedPokemon.map((c) => ({ category: "pokemon" as const, ...c })),
  ]
    .map((c) => ({
      category: c.category,
      name: c.name,
      rarity: c.rarity as Rarity,
      imageUrl: c.imageUrl,
      yieldPerAwakening: magnesieOf(c.category, c.slug, c.rarity as Rarity),
    }))
    .filter((c) => c.yieldPerAwakening != null);

  return Response.json({
    balance: u?.magnesie ?? 0,
    carriers,
    prices: UNBIND_PRICE,
  });
}
