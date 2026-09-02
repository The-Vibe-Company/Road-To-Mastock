import { db } from "@/lib/db";
import {
  animals,
  exercises,
  pokemon,
  sessionExercises,
    sets,
  userCharges,
  userMiracleUses,
  userShards,
  users,
} from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Rarity } from "@/lib/rarities";
import {
  DIRECTION_CAPS,
  cardioAwakeningMultiplier,
  FORGE_THRESHOLD,
  HAT_DIRECTIONS,
  POLARITY_POINTS,
  RECORD_MIN_HISTORY,
  WHEEL_SPELLS,
  metierOf,
  miracleOf,
  prodigeOf,
  type Charges,
  type Direction,
  type MascotMode,
} from "@/lib/powers";
import { pickMascotSide } from "@/lib/mascots";

// ─── Résolution des Gardiens (v2) à la clôture de séance ────────────────────
// Une fois par séance, dans le bloc idempotent tokensGrantedAt de terminate.
// Trois étages : la Polarité (± tickets de sa famille, mode au choix du
// joueur), les Prodiges (légendaires, un par carte), les Miracles
// (mythiques, un par carte, limites hebdomadaires). On ouvre son pack après
// la séance : clôturer une nouvelle séance remet d'abord le chapeau à zéro.

export interface AwakenedGuardian {
  exerciseId: number;
  exerciseName: string;
  card: {
    category: "animal" | "pokemon";
    name: string;
    rarity: Rarity;
    imageUrl: string | null;
  };
  powerName: string;
  // Ce que l'éveil a produit, en toutes lettres : "+3 tickets Animal",
  // "1 jeton spécial offert", "rien cette semaine (déjà utilisé)"...
  detail: string;
  record: boolean; // record battu sur SA machine (badge + effets sur record)
  fragmentRarity: Rarity | null;
}

export interface GuardianResolution {
  guardians: AwakenedGuardian[];
  recordCount: number;
  charges: Charges;
  bonusTokens: number; // jetons normaux offerts (Faveur, Grâce, Lame Résolue)
  bonusSpecialTokens: number; // jetons spéciaux offerts (le Vœu)
}

// ─── Chargement et remise à zéro ────────────────────────────────────────────

export async function loadCharges(userId: number): Promise<Charges> {
  const rows = await db
    .select({ direction: userCharges.direction, points: userCharges.points })
    .from(userCharges)
    .where(eq(userCharges.userId, userId));

  const charges: Charges = {};
  for (const r of rows) {
    if (r.points > 0) charges[r.direction as Direction] = r.points;
  }
  return charges;
}

export async function saveCharges(userId: number, charges: Charges) {
  const now = new Date();
  for (const [direction, points] of Object.entries(charges)) {
    await db
      .insert(userCharges)
      .values({ userId, direction, points: points ?? 0, updatedAt: now })
      .onConflictDoUpdate({
        target: [userCharges.userId, userCharges.direction],
        set: { points: points ?? 0, updatedAt: now },
      });
  }
}

// La règle du pack : on ouvre après la séance. Clôturer une NOUVELLE séance
// remet le chapeau à zéro avant la nouvelle récolte — l'énergie de pack non
// dépensée est annulée. Les jauges d'atelier (Forge, Curée, Orpailleur)
// survivent. Pactes : Dialga (Seconde Éternelle) épargne le chapeau une
// fois ; Ouroboros posé → jamais de remise à zéro ; Celebi posé → la
// moitié survit.
const WIPE_DIRECTIONS: Direction[] = [
  ...HAT_DIRECTIONS,
  ...WHEEL_SPELLS,
  "no_basic",
  "hoopa_double",
  "leviathan_guard",
  "banquise",
];

async function resetHatForNewSession(userId: number, charges: Charges) {
  const hasEnergy = WIPE_DIRECTIONS.some((d) => (charges[d] ?? 0) > 0);
  if (!hasEnergy) return;

  const [ouro] = await db
    .select({ id: animals.id })
    .from(animals)
    .where(eq(animals.slug, "ouroboros"));
  const [celebi] = await db
    .select({ id: pokemon.id })
    .from(pokemon)
    .where(eq(pokemon.slug, "celebi"));
  const posted = await db
    .select({ a: exercises.mascotAnimalId, p: exercises.mascotPokemonId })
    .from(exercises)
    .where(eq(exercises.userId, userId));
  if (ouro && posted.some((r) => r.a === ouro.id)) return; // l'Éternel Retour

  // La Seconde Éternelle de Dialga : consommée seulement si elle sert —
  // sous la garde d'Ouroboros, elle reste en réserve.
  if ((charges.time_hold ?? 0) > 0) {
    charges.time_hold = 0;
    return;
  }

  const half = !!celebi && posted.some((r) => r.p === celebi.id); // le Second Souffle
  for (const d of WIPE_DIRECTIONS) {
    const pts = charges[d] ?? 0;
    if (pts <= 0) continue;
    charges[d] = half ? Math.floor(pts / 2) : 0;
  }
}

// ─── Miracles hebdomadaires ─────────────────────────────────────────────────

function isoWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

// Tente de consommer l'usage hebdomadaire d'un miracle. True = disponible.
async function claimWeekly(userId: number, miracle: string, sessionDate: string) {
  const rows = await db
    .insert(userMiracleUses)
    .values({ userId, miracle, isoWeek: isoWeekStart(sessionDate) })
    .onConflictDoNothing()
    .returning({ id: userMiracleUses.id });
  return rows.length > 0;
}

// ─── Résolution ─────────────────────────────────────────────────────────────

export async function resolveGuardians(params: {
  userId: number;
  sessionId: number;
  sessionDate: string;
  weekPosition: number | null;
}): Promise<GuardianResolution> {
  const { userId, sessionId, sessionDate, weekPosition } = params;

  // 1. Machines gardées de la séance, avec au moins une série.
  const rows = await db
    .select({
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      mascotAnimalId: exercises.mascotAnimalId,
      mascotPokemonId: exercises.mascotPokemonId,
      mascotMode: exercises.mascotMode,
      variantId: sessionExercises.variantId,
      setCount: sql<number>`COUNT(${sets.id})::int`,
      volume: sql<number>`COALESCE(SUM(${sets.weightKg} * ${sets.reps}), 0)::float`,
      maxWeight: sql<number>`COALESCE(MAX(${sets.weightKg}), 0)::float`,
      cardioMinutes: sql<number>`COALESCE(SUM(${sets.durationMinutes}), 0)::int`,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .leftJoin(sets, eq(sets.sessionExerciseId, sessionExercises.id))
    .where(eq(sessionExercises.sessionId, sessionId))
    .groupBy(exercises.id, sessionExercises.id);

  type Entry = {
    exerciseId: number;
    exerciseName: string;
    side: { category: "animal" | "pokemon"; id: number };
    mode: MascotMode;
    variantId: number | null;
    volume: number;
    maxWeight: number;
    cardioMinutes: number;
  };
  const byExercise = new Map<number, Entry>();
  for (const r of rows) {
    if (r.setCount === 0) continue;
    const side = pickMascotSide(r.mascotAnimalId, r.mascotPokemonId);
    if (!side) continue;
    const existing = byExercise.get(r.exerciseId);
    if (existing) {
      existing.volume += r.volume;
      existing.maxWeight = Math.max(existing.maxWeight, r.maxWeight);
      existing.cardioMinutes += r.cardioMinutes;
    } else {
      byExercise.set(r.exerciseId, {
        exerciseId: r.exerciseId,
        exerciseName: r.exerciseName,
        side,
        mode: (r.mascotMode as MascotMode) ?? "attract",
        variantId: r.variantId ?? null,
        volume: r.volume,
        maxWeight: r.maxWeight,
        cardioMinutes: r.cardioMinutes,
      });
    }
  }
  // Ordre stable (id d'exercice) : l'Écho et les plafonds ne doivent pas
  // dépendre de l'ordre de retour du SQL.
  const entries = [...byExercise.values()].sort((a, b) => a.exerciseId - b.exerciseId);
  const charges = await loadCharges(userId);
  // La remise à zéro frappe à CHAQUE clôture, gardiens ou pas : l'énergie
  // de la séance précédente est annulée avant la nouvelle récolte.
  await resetHatForNewSession(userId, charges);
  if (entries.length === 0) {
    await saveCharges(userId, charges);
    return { guardians: [], recordCount: 0, charges, bonusTokens: 0, bonusSpecialTokens: 0 };
  }

  // 2. Cartes gardiennes.
  const animalIds = entries.filter((e) => e.side.category === "animal").map((e) => e.side.id);
  const pokemonIds = entries.filter((e) => e.side.category === "pokemon").map((e) => e.side.id);
  const animalRows = animalIds.length
    ? await db
        .select({ id: animals.id, slug: animals.slug, name: animals.name, rarity: animals.rarity, imageUrl: animals.imageUrl, subtype: animals.lineage })
        .from(animals)
        .where(inArray(animals.id, animalIds))
    : [];
  const pokemonRows = pokemonIds.length
    ? await db
        .select({ id: pokemon.id, slug: pokemon.slug, name: pokemon.name, rarity: pokemon.rarity, imageUrl: pokemon.imageUrl, subtype: pokemon.primaryType })
        .from(pokemon)
        .where(inArray(pokemon.id, pokemonIds))
    : [];
  const cardOf = (e: Entry) =>
    e.side.category === "animal"
      ? animalRows.find((a) => a.id === e.side.id)
      : pokemonRows.find((p) => p.id === e.side.id);

  // 3. Records par (exercice, version) — au moins 3 séances d'historique.
  const pairs = entries.map((e) => ({ exerciseId: e.exerciseId, variantId: e.variantId }));
  const historyRes = (await db.execute(sql`
    WITH wanted(exercise_id, variant_id) AS (
      VALUES ${sql.join(
        pairs.map((p) => sql`(${p.exerciseId}::int, ${p.variantId}::int)`),
        sql`, `,
      )}
    ),
    per_session AS (
      SELECT se.exercise_id, se.variant_id, se.session_id,
             MAX(st.weight_kg) AS maxw,
             SUM(st.weight_kg * st.reps) AS vol
      FROM session_exercises se
      JOIN sessions s ON s.id = se.session_id
      JOIN sets st ON st.session_exercise_id = se.id
      JOIN wanted w ON w.exercise_id = se.exercise_id
                   AND se.variant_id IS NOT DISTINCT FROM w.variant_id
      WHERE s.user_id = ${userId}
        AND se.session_id != ${sessionId}
        AND st.weight_kg IS NOT NULL
      GROUP BY se.exercise_id, se.variant_id, se.session_id
    )
    SELECT exercise_id, variant_id,
      COUNT(*)::int AS prior_sessions,
      COALESCE(MAX(maxw), 0)::float AS best_weight,
      COALESCE(MAX(vol), 0)::float AS best_volume
    FROM per_session
    GROUP BY exercise_id, variant_id
  `)) as unknown as { rows?: Record<string, unknown>[] };
  const histRows = (historyRes.rows ?? historyRes) as unknown as {
    exercise_id: number;
    variant_id: number | null;
    prior_sessions: number;
    best_weight: number;
    best_volume: number;
  }[];
  const histKey = (ex: number, v: number | null) => `${ex}:${v ?? 0}`;
  const history = new Map(histRows.map((h) => [histKey(h.exercise_id, h.variant_id), h]));

  // 4. Résolution. Les effets s'appliquent via un petit interprète : chaque
  // éveil produit des deltas de charges et/ou des gains immédiats.
  const guardians: AwakenedGuardian[] = [];
  let recordCount = 0;
  let bonusTokens = 0;
  let bonusSpecialTokens = 0;
  const deltas: Charges = {};
  const fragments: { rarity: Rarity; category: "animal" | "pokemon"; count: number }[] = [];
  const add = (d: Direction, n: number) => {
    deltas[d] = (deltas[d] ?? 0) + n;
  };

  // Arceus bénit les ± ; l'Écho imite le plus fort. Deux passes : d'abord
  // repérer Arceus et calculer les ± de base, puis appliquer.
  const arceusAwake = entries.some((e) => {
    const c = cardOf(e);
    return c?.slug === "arceus";
  });

  type Planned = {
    e: Entry;
    card: NonNullable<ReturnType<typeof cardOf>>;
    isRecord: boolean;
  };
  const planned: Planned[] = [];
  for (const e of entries) {
    const card = cardOf(e);
    if (!card) continue;
    const h = history.get(histKey(e.exerciseId, e.variantId));
    const isRecord =
      !!h &&
      h.prior_sessions >= RECORD_MIN_HISTORY &&
      (e.maxWeight > h.best_weight || e.volume > h.best_volume);
    if (isRecord) recordCount++;
    planned.push({ e, card, isRecord });
  }

  // Le geste ± le plus fort de la séance, pour l'Écho.
  let strongestPolarity: { direction: Direction; points: number } | null = null;

  for (const { e, card, isRecord } of planned) {
    const rarity = card.rarity as Rarity;
    const g: AwakenedGuardian = {
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseName,
      card: { category: e.side.category, name: card.name, rarity, imageUrl: card.imageUrl },
      powerName: "",
      detail: "",
      record: isRecord,
      fragmentRarity: null,
    };

    if (rarity !== "legendary" && rarity !== "mythic") {
      // ── Étage 1 : la Polarité, selon le métier de la carte ──
      // L'Endurance : les minutes de cardio du jour multiplient l'éveil
      // (+1 par quart d'heure complet, bonus à 30 min et à l'heure).
      const cardioMult = cardioAwakeningMultiplier(e.cardioMinutes);
      const pts =
        ((POLARITY_POINTS[rarity] ?? 1) + (arceusAwake ? 1 : 0)) * cardioMult;
      const family = e.side.category === "animal" ? "Animal" : "Pokémon";
      const metier = metierOf(e.side.category, card.subtype);
      const repel = e.mode === "repel";
      let direction: Direction;

      if (metier === "lest") {
        // Le Lest travaille le Basique dans les deux sens.
        direction = repel ? "purge_basic" : "pack_basic";
        add(direction, pts);
        g.powerName = repel ? "Le Lest — Répulsif" : "Le Lest — Attractif";
        g.detail = repel
          ? `${pts} ticket${pts > 1 ? "s" : ""} Basique dévoré${pts > 1 ? "s" : ""}`
          : `+${pts} ticket${pts > 1 ? "s" : ""} Basique`;
      } else if (metier === "etincelle") {
        // L'Étincelle sème du Mythique en dixièmes, ou brûle le Basique.
        if (repel) {
          direction = "purge_basic";
          add(direction, pts);
          g.powerName = "L'Étincelle — Répulsif";
          g.detail = `${pts} ticket${pts > 1 ? "s" : ""} Basique brûlé${pts > 1 ? "s" : ""}`;
        } else {
          direction = "mythic_sparks";
          add(direction, pts);
          g.powerName = "L'Étincelle";
          g.detail = `+${(pts / 10).toFixed(1).replace(".", ",")} ticket Mythique semé`;
        }
      } else if (metier === "balance") {
        // La Balance penche le curseur intérieur des packs mixtes.
        const ownSide: Direction = e.side.category === "animal" ? "inner_animal" : "inner_pokemon";
        const otherSide: Direction = e.side.category === "animal" ? "inner_pokemon" : "inner_animal";
        direction = repel ? otherSide : ownSide;
        add(direction, pts);
        const target =
          direction === "inner_animal" ? "les animaux" : "les Pokémon";
        g.powerName = repel ? "La Balance — Répulsif" : "La Balance — Attractif";
        g.detail = `curseur des packs mixtes : ${pts} % vers ${target}`;
      } else {
        // La Famille : le pack de sa famille, dans le sens choisi.
        direction = repel
          ? e.side.category === "animal" ? "repel_animal" : "repel_pokemon"
          : e.side.category === "animal" ? "pack_animal" : "pack_pokemon";
        add(direction, pts);
        g.powerName = repel ? "La Famille — Répulsif" : "La Famille — Attractif";
        g.detail = repel
          ? `${pts} ticket${pts > 1 ? "s" : ""} ${family} dévoré${pts > 1 ? "s" : ""}`
          : `+${pts} ticket${pts > 1 ? "s" : ""} ${family}`;
      }

      if (cardioMult > 1) g.detail += ` (endurance ×${cardioMult})`;

      // L'Écho des meutes légendaires imite les gestes de Famille uniquement
      // — les curseurs et étincelles ne se copient pas.
      if (
        (metier === "famille" || metier === "lest") &&
        (!strongestPolarity || pts > strongestPolarity.points)
      ) {
        strongestPolarity = { direction, points: pts };
      }
    } else if (rarity === "legendary") {
      // ── Étage 2 : les Prodiges — un pouvoir unique par carte ──
      const prodige = prodigeOf(e.side.category, card.slug);
      if (!prodige) {
        g.powerName = "Prodige endormi";
        g.detail = "cette carte n'a pas encore reçu son prodige";
      } else {
        g.powerName = prodige.name;
        const weeklyOk = prodige.weekly
          ? await claimWeekly(userId, `prodige-${prodige.id}`, sessionDate)
          : true;
        if (!weeklyOk) {
          g.detail = "déjà accompli cette semaine";
        } else {
          const applyAdd = (adds: Partial<Record<Direction, number>>) => {
            for (const [d, n] of Object.entries(adds) as [Direction, number][]) add(d, n);
          };
          const fx = prodige.effect;
          switch (fx.kind) {
            case "hat":
              applyAdd(fx.add);
              g.detail = fx.detail;
              break;
            case "token":
              if (Math.random() < fx.chance) {
                bonusTokens += 1;
                g.detail = fx.win;
              } else {
                g.detail = fx.miss;
              }
              break;
            case "fragment":
              if (!fx.needRecord || isRecord) {
                fragments.push({ rarity: fx.rarity, category: fx.fragCategory, count: fx.count });
                g.fragmentRarity = fx.rarity;
                g.detail = fx.detail;
              } else {
                g.detail = fx.wait ?? "il attend son heure";
              }
              break;
            case "weekpos":
              if (weekPosition === fx.position) {
                applyAdd(fx.add);
                g.detail = fx.detail;
              } else {
                g.detail = fx.wait;
              }
              break;
            case "record":
              if (isRecord) {
                applyAdd(fx.add);
                g.detail = fx.detail;
              } else {
                g.detail = fx.wait;
              }
              break;
            case "chaos": {
              const pick = fx.pool[Math.floor(Math.random() * fx.pool.length)];
              applyAdd(pick.add);
              g.detail = pick.detail;
              break;
            }
            case "echo":
              if (strongestPolarity) {
                add(strongestPolarity.direction, strongestPolarity.points);
                g.detail = `imite le plus fort : ${strongestPolarity.points} tickets`;
              } else {
                applyAdd(fx.fallback.add);
                g.detail = fx.fallback.detail;
              }
              break;
          }
        }
      }
    } else {
      // ── Étage 3 : les Miracles ──
      const miracle = miracleOf(e.side.category, card.slug);
      if (!miracle) {
        g.powerName = "Miracle endormi";
        g.detail = "cette carte n'a pas encore reçu son miracle";
      } else {
        g.powerName = miracle.name;
        // Les hebdomadaires CONDITIONNELS (Qilin, Victini, Keldeo) ne
        // brûlent leur usage de la semaine que si leur condition est
        // remplie — sinon un éveil « à vide » rendrait le pouvoir
        // inatteignable (« déjà accompli » sans avoir rien donné).
        const weeklyCondition =
          miracle.id === "pas-fortune"
            ? weekPosition === 1
            : miracle.id === "victoire-ecrite"
              ? recordCount > 0
              : miracle.id === "lame-resolue"
                ? weekPosition === 4
                : true;
        const weeklyOk =
          miracle.weekly && weeklyCondition
            ? await claimWeekly(userId, miracle.id, sessionDate)
            : true;
        if (!weeklyOk) {
          g.detail = "déjà accompli cette semaine";
        } else {
          switch (miracle.id) {
            case "gueule":
              add("purge_basic", 6);
              g.detail = "6 tickets Basique dévorés";
              break;
            case "eternel-retour":
              g.detail = "ton énergie échappe à la remise à zéro, pour toujours";
              break;
            case "etreinte-monde":
              add("pack_animal", 3);
              add("pack_pokemon", 3);
              g.detail = "+3 tickets Animal et +3 Pokémon";
              break;
            case "festin-songes":
              add("wheel_min2", 1);
              g.detail = "ta prochaine roue : le ×1 devient ×2";
              break;
            case "tetes-sans-nombre":
              add("pack_animal", 3);
              add("pack_pokemon", 3);
              add("pack_premium", 3);
              g.detail = "+3 tickets Animal, Pokémon et Premium";
              break;
            case "mere-des-dragons":
              add("pack_mythic", 3);
              g.detail = "+3 tickets Mythique";
              break;
            case "pardon-abysses":
              add("leviathan_guard", 1);
              g.detail = "un pack Basique ne consommera pas tes tickets";
              break;
            case "ombre-des-ailes":
              add("no_basic", 2);
              g.detail = "ton prochain pack refuse d'être Basique (deux fois)";
              break;
            case "copeaux":
              fragments.push({ rarity: "common", category: "animal", count: 2 });
              g.detail = "2 fragments communs offerts";
              break;
            case "premier-feu":
              add("pack_premium", 5);
              g.detail = "+5 tickets Premium";
              break;
            case "huit-tetes":
              add("pack_animal", 2);
              add("pack_pokemon", 2);
              add("pack_premium", 2);
              add("wheel_x3", 2);
              g.detail = "+2 tickets sur quatre portes à la fois";
              break;
            case "colere-du-pere":
              add("wheel_34", 1);
              g.detail = "ta prochaine roue : ×3 ou ×4, rien d'autre";
              break;
            case "devoreur-soleil":
              add("purge_basic", 5);
              add("repel_animal", 3);
              g.detail = "5 Basique et 3 Animal dévorés";
              break;
            case "grace":
              bonusTokens += 1;
              g.detail = "1 jeton offert";
              break;
            case "pas-fortune":
              if (weekPosition === 1) {
                add("qilin_wheel", 1);
                g.detail = "ta prochaine roue : ×2 / ×3 / ×4 / ×10";
              } else {
                g.detail = "il n'accorde son pas qu'à la première séance de la semaine";
              }
              break;
            case "voeu":
              bonusSpecialTokens += 1;
              g.detail = "1 jeton spécial offert — la roue t'attend";
              break;
            case "origine":
              if (e.mode === "repel") {
                add("purge_basic", 13);
                g.detail = "13 tickets Basique dévorés";
              } else {
                add("pack_pokemon", 13);
                g.detail = "+13 tickets Pokémon";
              }
              break;
            case "passe-mondes":
              add("hoopa_double", 1);
              g.detail = "ta prochaine ouverture tirera deux packs, garde le meilleur";
              break;
            case "gratitude":
              fragments.push({ rarity: "uncommon", category: "pokemon", count: 1 });
              g.detail = "1 fragment peu commun offert";
              break;
            case "nuit-devorante":
              add("purge_basic", 4);
              add("repel_animal", 4);
              g.detail = "4 Basique et 4 Animal dévorés";
              break;
            case "chant-des-flots":
              add("pack_pokemon", 8);
              g.detail = "+8 tickets Pokémon";
              break;
            case "victoire-ecrite":
              if (recordCount > 0) {
                fragments.push({ rarity: "rare", category: "pokemon", count: 1 });
                g.fragmentRarity = "rare";
                g.detail = "record de la semaine gravé — 1 fragment rare";
              } else {
                g.detail = "il attend ton premier record de la semaine";
              }
              break;
            case "coeur-diamant":
              add("orpailleur", 1);
              g.detail = "ta prochaine conversion rapportera +1 jeton";
              break;
            case "forge-vivante":
              add("forge", FORGE_THRESHOLD);
              g.detail = "Forge remplie — ta prochaine fusion coûte 2 fragments";
              break;
            case "second-souffle":
              g.detail = "la moitié de ton énergie survivra à chaque remise à zéro";
              break;
            case "adn-instable": {
              const roll = Math.random();
              const target: Direction =
                roll < 0.4 ? "pack_pokemon" : roll < 0.7 ? "pack_animal" : roll < 0.95 ? "pack_premium" : "pack_mythic";
              // Le Mythique est plafonné à 9 : on donne le plafond, et on
              // l'affiche tel quel plutôt que de promettre 13 fantômes.
              const amount = target === "pack_mythic" ? 9 : 13;
              add(target, amount);
              g.detail = `mutation : +${amount} vers ${target === "pack_mythic" ? "le Mythique ! (le plafond)" : target === "pack_premium" ? "le Premium" : target === "pack_animal" ? "l'Animal" : "le Pokémon"}`;
              break;
            }
            case "aria":
              add("wheel_x3", 6);
              g.detail = "+6 tickets sur la case ×3 de la roue";
              break;
            case "alpha-omega":
              g.detail = "chaque autre Gardien ± de la séance compte +1";
              break;
            case "lame-resolue":
              if (weekPosition === 4) {
                bonusTokens += 1;
                g.detail = "4ᵉ séance de la semaine — 1 jeton offert";
              } else {
                g.detail = "il salue la discipline à la 4ᵉ séance de la semaine";
              }
              break;
            case "vapeur-sacree":
              add("purge_basic", 4);
              add("pack_premium", 4);
              g.detail = "4 Basique transmutés en 4 Premium";
              break;
            default:
              g.detail = "miracle inconnu";
          }
        }
      }
    }
    guardians.push(g);
  }

  // 5. Crédit des charges, avec plafonds.
  for (const [d, delta] of Object.entries(deltas) as [Direction, number][]) {
    charges[d] = Math.min(DIRECTION_CAPS[d], Math.max(0, (charges[d] ?? 0) + delta));
  }
  await saveCharges(userId, charges);

  // 6. Fragments offerts.
  for (const f of fragments) {
    await db
      .insert(userShards)
      .values({ userId, rarity: f.rarity, category: f.category, count: f.count })
      .onConflictDoUpdate({
        target: [userShards.userId, userShards.rarity, userShards.category],
        set: { count: sql`${userShards.count} + ${f.count}` },
      });
  }

  // 7. Jetons offerts (Faveur, Grâce, Lame Résolue, le Vœu).
  if (bonusTokens > 0) {
    await db
      .update(users)
      .set({ cardsTokens: sql`${users.cardsTokens} + ${bonusTokens}` })
      .where(eq(users.id, userId));
  }
  if (bonusSpecialTokens > 0) {
    await db
      .update(users)
      .set({ cardsSpecialTokens: sql`${users.cardsSpecialTokens} + ${bonusSpecialTokens}` })
      .where(eq(users.id, userId));
  }

  // 8. Compteur d'éveils (talents évolutifs : la Légende de la Carpe...).
  const awakenedIds = guardians.map((g) => g.exerciseId);
  if (awakenedIds.length > 0) {
    await db
      .update(exercises)
      .set({ mascotTriggers: sql`${exercises.mascotTriggers} + 1` })
      .where(inArray(exercises.id, awakenedIds));
  }

  return { guardians, recordCount, charges, bonusTokens, bonusSpecialTokens };
}

// ─── Le Gardien lié ─────────────────────────────────────────────────────────
// Depuis la pose : soit un record (charge max OU volume) a été battu sur la
// machine, soit 30 jours sont passés. Sinon, la carte reste.

export async function guardianBondStatus(
  exerciseId: number,
  userId: number,
): Promise<{ locked: boolean; unlockAt: string | null; grace: boolean }> {
  const [ex] = await db
    .select({
      assignedAt: exercises.mascotAssignedAt,
      mascotAnimalId: exercises.mascotAnimalId,
      mascotPokemonId: exercises.mascotPokemonId,
      mascotTriggers: exercises.mascotTriggers,
    })
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)));

  // Pas de gardien, ou pose antérieure à la règle : libre.
  if (!ex || (!ex.mascotAnimalId && !ex.mascotPokemonId) || !ex.assignedAt) {
    return { locked: false, unlockAt: null, grace: false };
  }

  const assignedAt = new Date(ex.assignedAt);
  const unlockDate = new Date(assignedAt.getTime() + 30 * 86400000);
  const unlockAt = unlockDate.toISOString().slice(0, 10);

  // La période de grâce : le lien ne se noue qu'au premier éveil. Tant que
  // la carte n'a pas travaillé, on peut encore changer d'avis.
  if ((ex.mascotTriggers ?? 0) === 0) {
    return { locked: false, unlockAt, grace: true };
  }

  if (Date.now() >= unlockDate.getTime()) return { locked: false, unlockAt: null, grace: false };

  // Record battu depuis la pose ? On cherche la MEILLEURE séance (poids et
  // volume) : si la plus ancienne à détenir le meilleur est postérieure à la
  // pose, c'est qu'un record est tombé depuis.
  const res = (await db.execute(sql`
    WITH per_session AS (
      SELECT s.date, MAX(st.weight_kg) AS maxw, SUM(st.weight_kg * st.reps) AS vol
      FROM session_exercises se
      JOIN sessions s ON s.id = se.session_id
      JOIN sets st ON st.session_exercise_id = se.id
      WHERE se.exercise_id = ${exerciseId} AND s.user_id = ${userId}
        AND st.weight_kg IS NOT NULL
      GROUP BY s.id, s.date
    )
    SELECT
      (SELECT date FROM per_session ORDER BY maxw DESC, date ASC LIMIT 1) AS best_w,
      (SELECT date FROM per_session ORDER BY vol DESC, date ASC LIMIT 1) AS best_v
  `)) as unknown as { rows?: { best_w: string | null; best_v: string | null }[] };
  const [row] = ((res.rows ?? res) as unknown as { best_w: string | null; best_v: string | null }[]);
  const cutoff = assignedAt.toISOString().slice(0, 10);
  const beaten =
    (row?.best_w != null && row.best_w >= cutoff) ||
    (row?.best_v != null && row.best_v >= cutoff);

  if (beaten) return { locked: false, unlockAt: null, grace: false };
  return { locked: true, unlockAt, grace: false };
}
