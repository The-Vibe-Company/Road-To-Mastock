import { db } from "@/lib/db";
import { exercises, userCards, userPokemonCards, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { TROPHIES, earnedTrophyIds, type TrophyStats } from "@/lib/trophies";

// Les statistiques du cabinet : tout se recalcule depuis les données réelles,
// rien n'est stocké — un trophée ne peut pas mentir.
export async function computeTrophyStats(
  userId: number,
  // L'état « avant cette séance » : on recalcule tout comme si elle
  // n'existait pas — c'est ce qui permet de montrer l'avancée à la clôture.
  excludeSessionId?: number,
): Promise<TrophyStats> {
  const excl = excludeSessionId != null ? sql`AND s.id != ${excludeSessionId}` : sql``;
  // Séances, tonnage, variété, meilleure semaine — en une passe.
  const mainRes = (await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM sessions s
        WHERE s.user_id = ${userId} AND s.tokens_granted_at IS NOT NULL ${excl}) AS sessions,
      (SELECT COALESCE(SUM(st.weight_kg * st.reps), 0)::float
        FROM sets st
        JOIN session_exercises se ON se.id = st.session_exercise_id
        JOIN sessions s ON s.id = se.session_id
        WHERE s.user_id = ${userId} ${excl}) AS tonnage,
      (SELECT COUNT(DISTINCT se.exercise_id)::int
        FROM session_exercises se
        JOIN sessions s ON s.id = se.session_id
        JOIN sets st ON st.session_exercise_id = se.id
        WHERE s.user_id = ${userId} ${excl}) AS exercises,
      (SELECT COALESCE(MAX(n), 0)::int FROM (
        SELECT COUNT(*)::int AS n FROM sessions s
        WHERE s.user_id = ${userId} AND s.tokens_granted_at IS NOT NULL ${excl}
        GROUP BY DATE_TRUNC('week', s.date::timestamp)
      ) w) AS best_week,
      (SELECT COUNT(*)::int FROM sets st
        JOIN session_exercises se ON se.id = st.session_exercise_id
        JOIN sessions s ON s.id = se.session_id
        WHERE s.user_id = ${userId} ${excl}) AS total_sets,
      (SELECT COALESCE(MAX(st.weight_kg), 0)::float FROM sets st
        JOIN session_exercises se ON se.id = st.session_exercise_id
        JOIN sessions s ON s.id = se.session_id
        WHERE s.user_id = ${userId} ${excl}) AS max_weight,
      (SELECT COALESCE(SUM(st.duration_minutes), 0)::int FROM sets st
        JOIN session_exercises se ON se.id = st.session_exercise_id
        JOIN sessions s ON s.id = se.session_id
        WHERE s.user_id = ${userId} ${excl}) AS cardio_minutes
  `)) as unknown as { rows?: Record<string, unknown>[] };
  const main = ((mainRes.rows ?? mainRes) as unknown as {
    sessions: number; tonnage: number; exercises: number; best_week: number;
    total_sets: number; max_weight: number; cardio_minutes: number;
  }[])[0];

  // Records battus : chaque séance qui a dépassé le meilleur poids ou le
  // meilleur volume connu jusqu'alors, machine par machine.
  const recordsRes = (await db.execute(sql`
    WITH per_ex AS (
      SELECT se.exercise_id, se.variant_id, se.session_id, s.date, s.created_at,
             MAX(st.weight_kg) AS maxw, SUM(st.weight_kg * st.reps) AS vol
      FROM session_exercises se
      JOIN sessions s ON s.id = se.session_id
      JOIN sets st ON st.session_exercise_id = se.id
      WHERE s.user_id = ${userId} AND st.weight_kg IS NOT NULL ${excl}
      GROUP BY se.exercise_id, se.variant_id, se.session_id, s.date, s.created_at
    )
    SELECT COUNT(*)::int AS records FROM (
      SELECT maxw > COALESCE(MAX(maxw) OVER w, 0) OR vol > COALESCE(MAX(vol) OVER w, 0) AS is_record,
             ROW_NUMBER() OVER (PARTITION BY exercise_id, variant_id ORDER BY date, created_at) AS rn
      FROM per_ex
      WINDOW w AS (
        PARTITION BY exercise_id, variant_id ORDER BY date, created_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      )
    -- Même verrou que le moteur des Gardiens (RECORD_MIN_HISTORY = 3) :
    -- un record ne compte qu'avec au moins 3 séances d'historique, sinon
    -- la première séance de chaque machine est un record automatique.
    ) f WHERE is_record AND rn >= 4
  `)) as unknown as { rows?: { records: number }[] };
  const records = ((recordsRes.rows ?? recordsRes) as unknown as { records: number }[])[0]?.records ?? 0;

  // Semaines consécutives, en remontant depuis la plus récente.
  const weeksRes = (await db.execute(sql`
    SELECT DISTINCT DATE_TRUNC('week', s.date::timestamp)::date AS wk
    FROM sessions s WHERE s.user_id = ${userId} AND s.tokens_granted_at IS NOT NULL ${excl}
    ORDER BY wk DESC
  `)) as unknown as { rows?: { wk: string }[] };
  const weeks = ((weeksRes.rows ?? weeksRes) as unknown as { wk: string }[]).map((r) => new Date(r.wk).getTime());
  let streakWeeks = weeks.length > 0 ? 1 : 0;
  for (let i = 1; i < weeks.length; i++) {
    if (weeks[i - 1] - weeks[i] === 7 * 86400000) streakWeeks++;
    else break;
  }

  const [a] = await db.select({ n: sql<number>`COUNT(*)::int` }).from(userCards).where(eq(userCards.userId, userId));
  const [p] = await db.select({ n: sql<number>`COUNT(*)::int` }).from(userPokemonCards).where(eq(userPokemonCards.userId, userId));
  const [g] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(exercises)
    .where(sql`${exercises.userId} = ${userId} AND (mascot_animal_id IS NOT NULL OR mascot_pokemon_id IS NOT NULL)`);

  return {
    sessions: Number(main?.sessions ?? 0),
    tonnage: Math.round(Number(main?.tonnage ?? 0)),
    exercises: Number(main?.exercises ?? 0),
    bestWeek: Number(main?.best_week ?? 0),
    sets: Number(main?.total_sets ?? 0),
    maxWeight: Math.round(Number(main?.max_weight ?? 0)),
    cardioMinutes: Number(main?.cardio_minutes ?? 0),
    records: Number(records),
    streakWeeks,
    cardsOwned: (a?.n ?? 0) + (p?.n ?? 0),
    guardiansPosted: g?.n ?? 0,
  };
}

export async function earnedTrophies(userId: number): Promise<string[]> {
  return earnedTrophyIds(await computeTrophyStats(userId));
}

// À la clôture : célèbre les trophées jamais annoncés, puis les marque.
export async function claimNewTrophies(userId: number): Promise<string[]> {
  const earned = await earnedTrophies(userId);
  const [u] = await db
    .select({ announced: users.announcedTrophies })
    .from(users)
    .where(eq(users.id, userId));
  const seen = new Set((u?.announced ?? "").split(",").filter(Boolean));
  const fresh = earned.filter((id) => !seen.has(id));
  if (fresh.length > 0) {
    for (const id of fresh) seen.add(id);
    await db
      .update(users)
      .set({ announcedTrophies: [...seen].join(",") })
      .where(eq(users.id, userId));
  }
  return fresh;
}

// ─── L'avancée de la clôture ────────────────────────────────────────────────
// Ce que CETTE séance a fait avancer : pour chaque famille dont le compteur
// a bougé, le prochain trophée visé avec l'avant → après. Les trophées
// GAGNÉS par la séance ne sont pas listés ici — ils ont leur célébration.

export interface TrophyProgressStep {
  stat: string;
  name: string;
  target: number;
  before: number;
  after: number;
}

export async function sessionTrophyProgress(
  userId: number,
  sessionId: number,
): Promise<TrophyProgressStep[]> {
  const [after, before] = await Promise.all([
    computeTrophyStats(userId),
    computeTrophyStats(userId, sessionId),
  ]);
  const steps: TrophyProgressStep[] = [];
  for (const stat of Object.keys(after) as (keyof TrophyStats)[]) {
    const b = Number(before[stat] ?? 0);
    const a = Number(after[stat] ?? 0);
    if (a <= b) continue;
    const ladder = TROPHIES.filter((t) => t.stat === stat).sort((x, y) => x.target - y.target);
    const next = ladder.find((t) => t.target > b);
    if (!next) continue;
    if (a >= next.target) continue; // gagné à cette clôture → célébré à part
    steps.push({ stat, name: next.name, target: next.target, before: b, after: a });
  }
  // Les plus proches du but d'abord, cinq au maximum.
  steps.sort((x, y) => y.after / y.target - x.after / x.target);
  return steps.slice(0, 5);
}
