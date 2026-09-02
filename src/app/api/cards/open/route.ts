import { db } from "@/lib/db";
import {
  animals,
  pokemon,
  userCards,
  userPokemonCards,
  userShards,
  users,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { rollRarityForPack, PACK_TYPES, PACK_CATEGORY_PROB_POKEMON, type PackType } from "@/lib/pack-types";
import { HAT_DIRECTIONS, buildPackHat, innerPokemonProb, type Charges } from "@/lib/powers";
import { loadCharges, saveCharges } from "@/lib/guardians";
import { talentOf } from "@/lib/talents";

// Hiérarchie de désirabilité des packs, pour le Passe-Mondes de Hoopa.
const PACK_RANK: Record<PackType, number> = {
  mythic: 5,
  premium: 4,
  pokemon_only: 3,
  basic: 2,
  animal_only: 1,
};

// Tirage du type de pack dans le chapeau chargé par les Gardiens, avec les
// sorts à un coup : l'Ascension refuse le Basique, le Passe-Mondes tire deux
// packs et garde le meilleur.
function rollPackTypeFromHat(charges: Charges): PackType {
  const hat = buildPackHat(charges);
  const total = Object.values(hat).reduce((a, b) => a + b, 0);
  const rollOnce = (): PackType => {
    if (total <= 0) return "basic";
    let r = Math.random() * total;
    for (const t of PACK_TYPES) {
      r -= hat[t];
      if (r <= 0) return t;
    }
    return "basic";
  };
  let pick = rollOnce();
  // L'Ascension / l'Ombre des Ailes : chaque charge retire un Basique.
  let rerolls = charges.no_basic ?? 0;
  while (pick === "basic" && rerolls > 0) {
    rerolls--;
    pick = rollOnce();
  }
  // Le Passe-Mondes : deux tirages, on garde le meilleur.
  if ((charges.hoopa_double ?? 0) > 0) {
    const second = rollOnce();
    if (PACK_RANK[second] > PACK_RANK[pick]) pick = second;
  }
  return pick;
}

// Consommation : le chapeau se vide à l'ouverture. La Banquise préserve
// jusqu'à N tickets par direction ; le Pardon des Abysses (Léviathan)
// épargne tout le chapeau si le pack tiré est un Basique.
function consumeHat(charges: Charges, packType: PackType): Charges {
  const next: Charges = { ...charges };
  // Sorts à un coup : consommés quoi qu'il arrive.
  next.no_basic = 0;
  next.hoopa_double = 0;
  if (packType === "basic" && (charges.leviathan_guard ?? 0) > 0) {
    next.leviathan_guard = 0;
    return next; // le chapeau entier survit
  }
  next.leviathan_guard = 0;
  const preserve = charges.banquise ?? 0;
  for (const d of HAT_DIRECTIONS) {
    const current = next[d] ?? 0;
    next[d] = Math.min(current, preserve);
  }
  next.banquise = 0;
  return next;
}

// Debug knobs (leave unset in prod):
//   CARDS_DEBUG_FORCE_PACK_TYPE=basic|animal_only|pokemon_only|premium|mythic
//   CARDS_DEBUG_FORCE_ANIMAL_SLUG=<slug>
//   CARDS_DEBUG_FORCE_POKEMON_SLUG=<slug>
//   CARDS_DEBUG_FREE_TOKENS=true
const DEBUG_FORCE_PACK = process.env.CARDS_DEBUG_FORCE_PACK_TYPE as PackType | undefined;
const DEBUG_FORCE_ANIMAL = process.env.CARDS_DEBUG_FORCE_ANIMAL_SLUG;
const DEBUG_FORCE_POKEMON = process.env.CARDS_DEBUG_FORCE_POKEMON_SLUG;
const DEBUG_FREE_TOKENS = process.env.CARDS_DEBUG_FREE_TOKENS === "true";

// POST: spends 1 token to open a pack.
// 1. Roll pack type (64% basic / 15% animal-only / 15% pokemon-only / 5% premium / 1% mythic).
// 2. Roll category from pack type (forced for animal/pokemon-only, weighted otherwise).
// 3. Roll rarity from pack type (premium drops commons, mythic only legendary+).
// 4. Pick a random creature in (category, rarity).
// 5. Insert in user collection. If duplicate, also grant 1 fragment.
export async function POST() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Spend 1 token (skip if debug free tokens)
  let tokensRemaining: number;
  if (DEBUG_FREE_TOKENS) {
    const [u] = await db
      .select({ tokens: users.cardsTokens })
      .from(users)
      .where(eq(users.id, auth.userId));
    tokensRemaining = u?.tokens ?? 0;
  } else {
    const [decremented] = await db
      .update(users)
      .set({ cardsTokens: sql`${users.cardsTokens} - 1` })
      .where(and(eq(users.id, auth.userId), sql`${users.cardsTokens} >= 1`))
      .returning({ tokens: users.cardsTokens });
    if (!decremented) {
      return Response.json({ error: "Pas de jeton disponible" }, { status: 400 });
    }
    tokensRemaining = decremented.tokens;
  }

  // Énergie des Gardiens : chargée aux clôtures de séance, consommée ici.
  const charges = await loadCharges(auth.userId);
  const packType: PackType = DEBUG_FORCE_PACK ?? rollPackTypeFromHat(charges);
  const category = DEBUG_FORCE_ANIMAL
    ? "animal"
    : DEBUG_FORCE_POKEMON
      ? "pokemon"
      : Math.random() < innerPokemonProb(PACK_CATEGORY_PROB_POKEMON[packType], charges)
        ? "pokemon"
        : "animal";
  // La Curée se lit avant consommation ; le reste du chapeau se vide selon
  // les pactes (Banquise, Pardon des Abysses).
  const cureeCharges = charges.curee ?? 0;
  await saveCharges(auth.userId, consumeHat(charges, packType));

  if (category === "animal") {
    let picked;
    if (DEBUG_FORCE_ANIMAL) {
      [picked] = await db
        .select()
        .from(animals)
        .where(eq(animals.slug, DEBUG_FORCE_ANIMAL));
      if (!picked) {
        await refund(auth.userId);
        return Response.json(
          { error: `Debug slug not found: ${DEBUG_FORCE_ANIMAL}` },
          { status: 500 },
        );
      }
    } else {
      const rarity = rollRarityForPack(packType);
      const candidates = await db
        .select()
        .from(animals)
        .where(eq(animals.rarity, rarity));
      if (candidates.length === 0) {
        await refund(auth.userId);
        return Response.json({ error: `No animals for rarity ${rarity}` }, { status: 500 });
      }
      picked = candidates[Math.floor(Math.random() * candidates.length)];
    }
    const rarity = picked.rarity as
      | "common"
      | "uncommon"
      | "rare"
      | "epic"
      | "legendary"
      | "mythic";

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
      // La Curée : une charge stockée double le fragment du doublon.
      const bonus = cureeCharges > 0 ? 1 : 0;
      if (bonus) {
        const after = await loadCharges(auth.userId);
        after.curee = Math.max(0, (after.curee ?? 0) - 1);
        await saveCharges(auth.userId, after);
      }
      shardsGranted = 1 + bonus;
      await db
        .insert(userShards)
        .values({ userId: auth.userId, rarity, category: "animal", count: shardsGranted })
        .onConflictDoUpdate({
          target: [userShards.userId, userShards.rarity, userShards.category],
          set: { count: sql`${userShards.count} + ${shardsGranted}` },
        });
    }

    // Talent caché : révélé à la première obtention de la carte.
    const talent = !isDuplicate ? talentOf("animal", picked.slug) : null;

    return Response.json({
      packType,
      category,
      rarity,
      creature: { ...picked, kind: "animal" },
      isDuplicate,
      shardsGranted,
      talent: talent
        ? { id: talent.id, family: talent.family, name: talent.name, description: talent.description }
        : null,
      tokens: tokensRemaining,
    });
  }

  // pokemon
  let picked;
  if (DEBUG_FORCE_POKEMON) {
    [picked] = await db
      .select()
      .from(pokemon)
      .where(eq(pokemon.slug, DEBUG_FORCE_POKEMON));
    if (!picked) {
      await refund(auth.userId);
      return Response.json(
        { error: `Debug slug not found: ${DEBUG_FORCE_POKEMON}` },
        { status: 500 },
      );
    }
  } else {
    const rarity = rollRarityForPack(packType);
    const candidates = await db
      .select()
      .from(pokemon)
      .where(eq(pokemon.rarity, rarity));
    if (candidates.length === 0) {
      await refund(auth.userId);
      return Response.json({ error: `No pokemon for rarity ${rarity}` }, { status: 500 });
    }
    picked = candidates[Math.floor(Math.random() * candidates.length)];
  }
  const rarity = picked.rarity as
    | "common"
    | "uncommon"
    | "rare"
    | "epic"
    | "legendary"
    | "mythic";

  const [card] = await db
    .insert(userPokemonCards)
    .values({ userId: auth.userId, pokemonId: picked.id, count: 1 })
    .onConflictDoUpdate({
      target: [userPokemonCards.userId, userPokemonCards.pokemonId],
      set: { count: sql`${userPokemonCards.count} + 1` },
    })
    .returning();

  const isDuplicate = (card?.count ?? 1) > 1;
  let shardsGranted = 0;
  if (isDuplicate) {
    const bonus = cureeCharges > 0 ? 1 : 0;
    if (bonus) {
      const after = await loadCharges(auth.userId);
      after.curee = Math.max(0, (after.curee ?? 0) - 1);
      await saveCharges(auth.userId, after);
    }
    shardsGranted = 1 + bonus;
    await db
      .insert(userShards)
      .values({ userId: auth.userId, rarity, category: "pokemon", count: shardsGranted })
      .onConflictDoUpdate({
        target: [userShards.userId, userShards.rarity, userShards.category],
        set: { count: sql`${userShards.count} + ${shardsGranted}` },
      });
  }

  const talent = !isDuplicate ? talentOf("pokemon", picked.slug) : null;

  return Response.json({
    packType,
    category,
    rarity,
    creature: { ...picked, kind: "pokemon" },
    isDuplicate,
    shardsGranted,
    talent: talent
      ? { id: talent.id, family: talent.family, name: talent.name, description: talent.description }
      : null,
    tokens: tokensRemaining,
  });
}

async function refund(userId: number) {
  if (DEBUG_FREE_TOKENS) return;
  await db
    .update(users)
    .set({ cardsTokens: sql`${users.cardsTokens} + 1` })
    .where(eq(users.id, userId));
}
