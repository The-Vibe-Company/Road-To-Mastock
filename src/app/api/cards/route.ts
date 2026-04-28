import { db } from "@/lib/db";
import {
  animals,
  pokemon,
  userCards,
  userPokemonCards,
  userShards,
  users,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { RARITIES, type Rarity } from "@/lib/rarities";

type Category = "animal" | "pokemon";

const EMPTY_RARITY_RECORD = (): Record<Rarity, number> => ({
  common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0,
});

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const ownedAnimals = await db
    .select({
      id: userCards.animalId,
      count: userCards.count,
      firstObtainedAt: userCards.firstObtainedAt,
      slug: animals.slug,
      name: animals.name,
      rarity: animals.rarity,
      cardNumber: animals.cardNumber,
      scientificName: animals.scientificName,
      imageUrl: animals.imageUrl,
      description: animals.description,
      flavor: animals.flavor,
      heightCm: animals.heightCm,
      weightKg: animals.weightKg,
      habitat: animals.habitat,
    })
    .from(userCards)
    .innerJoin(animals, eq(userCards.animalId, animals.id))
    .where(eq(userCards.userId, auth.userId));

  const ownedPokemon = await db
    .select({
      id: userPokemonCards.pokemonId,
      count: userPokemonCards.count,
      firstObtainedAt: userPokemonCards.firstObtainedAt,
      slug: pokemon.slug,
      name: pokemon.name,
      rarity: pokemon.rarity,
      pokedexNumber: pokemon.pokedexNumber,
      primaryType: pokemon.primaryType,
      secondaryType: pokemon.secondaryType,
      imageUrl: pokemon.imageUrl,
      flavor: pokemon.flavor,
      heightCm: pokemon.heightCm,
      weightKg: pokemon.weightKg,
      habitat: pokemon.habitat,
    })
    .from(userPokemonCards)
    .innerJoin(pokemon, eq(userPokemonCards.pokemonId, pokemon.id))
    .where(eq(userPokemonCards.userId, auth.userId));

  // Totals per category per rarity
  const animalTotals = await db.select({ rarity: animals.rarity }).from(animals);
  const pokemonTotals = await db.select({ rarity: pokemon.rarity }).from(pokemon);

  const animalTotalsByRarity = EMPTY_RARITY_RECORD();
  for (const a of animalTotals) {
    if (RARITIES.includes(a.rarity as Rarity)) animalTotalsByRarity[a.rarity as Rarity]++;
  }
  const pokemonTotalsByRarity = EMPTY_RARITY_RECORD();
  for (const p of pokemonTotals) {
    if (RARITIES.includes(p.rarity as Rarity)) pokemonTotalsByRarity[p.rarity as Rarity]++;
  }

  const shardRows = await db
    .select({ rarity: userShards.rarity, category: userShards.category, count: userShards.count })
    .from(userShards)
    .where(eq(userShards.userId, auth.userId));

  const shards: Record<Category, Record<Rarity, number>> = {
    animal: EMPTY_RARITY_RECORD(),
    pokemon: EMPTY_RARITY_RECORD(),
  };
  for (const s of shardRows) {
    if (
      RARITIES.includes(s.rarity as Rarity) &&
      (s.category === "animal" || s.category === "pokemon")
    ) {
      shards[s.category as Category][s.rarity as Rarity] = s.count;
    }
  }

  const [user] = await db
    .select({ tokens: users.cardsTokens })
    .from(users)
    .where(eq(users.id, auth.userId));

  return Response.json({
    animals: {
      cards: ownedAnimals,
      totalsByRarity: animalTotalsByRarity,
      shards: shards.animal,
    },
    pokemon: {
      cards: ownedPokemon,
      totalsByRarity: pokemonTotalsByRarity,
      shards: shards.pokemon,
    },
    tokens: user?.tokens ?? 0,
  });
}
