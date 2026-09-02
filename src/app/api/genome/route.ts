import { db } from "@/lib/db";
import { animals, pokemon, userCards, userPokemonCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { unlockedTalents } from "@/lib/talents-server";

// Le Génome (Mew) : l'index intégral du catalogue — toutes les cartes,
// possédées ou non, avec leur rareté. Les non possédées sortent en
// silhouette côté client.
export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const talents = await unlockedTalents(auth.userId);
  if (!talents.some((t) => t.id === "genome")) {
    return Response.json({ error: "Talent requis" }, { status: 403 });
  }

  const [allAnimals, allPokemon, ownedA, ownedP] = await Promise.all([
    db.select({ id: animals.id, name: animals.name, rarity: animals.rarity, imageUrl: animals.imageUrl, number: animals.cardNumber }).from(animals),
    db.select({ id: pokemon.id, name: pokemon.name, rarity: pokemon.rarity, imageUrl: pokemon.imageUrl, number: pokemon.pokedexNumber }).from(pokemon),
    db.select({ id: userCards.animalId }).from(userCards).where(eq(userCards.userId, auth.userId)),
    db.select({ id: userPokemonCards.pokemonId }).from(userPokemonCards).where(eq(userPokemonCards.userId, auth.userId)),
  ]);

  const ownedAnimals = new Set(ownedA.map((r) => r.id));
  const ownedPokemon = new Set(ownedP.map((r) => r.id));

  return Response.json({
    animals: allAnimals.map((a) => ({ ...a, owned: ownedAnimals.has(a.id) })),
    pokemon: allPokemon.map((p) => ({ ...p, owned: ownedPokemon.has(p.id) })),
  });
}
