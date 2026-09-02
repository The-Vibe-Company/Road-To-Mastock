import { db } from "@/lib/db";
import { animals, pokemon, userCards, userPokemonCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { TALENTS, type TalentDef } from "@/lib/talents";

export interface TalentWithCard {
  talent: TalentDef;
  card: {
    category: "animal" | "pokemon";
    slug: string;
    name: string;
    rarity: string;
    imageUrl: string | null;
  };
}

// Talents débloqués AVEC leur carte porteuse — une fois la carte possédée,
// le secret est levé pour son propriétaire.
export async function unlockedTalentsWithCards(userId: number): Promise<TalentWithCard[]> {
  const a = await db
    .select({ slug: animals.slug, name: animals.name, rarity: animals.rarity, imageUrl: animals.imageUrl })
    .from(userCards)
    .innerJoin(animals, eq(userCards.animalId, animals.id))
    .where(eq(userCards.userId, userId));
  const p = await db
    .select({ slug: pokemon.slug, name: pokemon.name, rarity: pokemon.rarity, imageUrl: pokemon.imageUrl })
    .from(userPokemonCards)
    .innerJoin(pokemon, eq(userPokemonCards.pokemonId, pokemon.id))
    .where(eq(userPokemonCards.userId, userId));
  const result: TalentWithCard[] = [];
  for (const r of a) {
    const t = TALENTS[`animal:${r.slug}`];
    if (t) result.push({ talent: t, card: { category: "animal", ...r } });
  }
  for (const r of p) {
    const t = TALENTS[`pokemon:${r.slug}`];
    if (t) result.push({ talent: t, card: { category: "pokemon", ...r } });
  }
  return result;
}

// Talents débloqués = cartes possédées qui figurent dans le registre.
// Posséder suffit, pour toujours — un talent ne se "consomme" pas.
export async function unlockedTalents(userId: number): Promise<TalentDef[]> {
  const owned = await ownedTalentKeys(userId);
  return owned.map((k) => TALENTS[k]);
}

// Clés d'accent scellées auxquelles l'utilisateur a droit.
export async function unlockedAccents(userId: number): Promise<Set<string>> {
  const owned = await ownedTalentKeys(userId);
  const keys = new Set<string>();
  for (const k of owned) {
    const t = TALENTS[k];
    if (t.effect.kind === "accent") for (const a of t.effect.accents ?? []) keys.add(a);
  }
  return keys;
}

async function ownedTalentKeys(userId: number): Promise<string[]> {
  const a = await db
    .select({ slug: animals.slug })
    .from(userCards)
    .innerJoin(animals, eq(userCards.animalId, animals.id))
    .where(eq(userCards.userId, userId));
  const p = await db
    .select({ slug: pokemon.slug })
    .from(userPokemonCards)
    .innerJoin(pokemon, eq(userPokemonCards.pokemonId, pokemon.id))
    .where(eq(userPokemonCards.userId, userId));
  return [
    ...a.map((r) => `animal:${r.slug}`),
    ...p.map((r) => `pokemon:${r.slug}`),
  ].filter((k) => k in TALENTS);
}
