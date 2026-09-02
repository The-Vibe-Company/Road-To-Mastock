import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { unlockedTalents } from "@/lib/talents-server";

// L'Oracle : les savoirs débloqués par les auras. Chaque section n'est
// calculée ET renvoyée que si le talent correspondant est possédé.
export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const talents = await unlockedTalents(auth.userId);
  const has = (id: string) => talents.some((t) => t.id === id);
  const payload: Record<string, unknown> = {
    unlocked: talents.filter((t) => t.family === "oracle").map((t) => t.id),
  };

  // La Boucle (Ouroboros) : chaque record battu, dans l'ordre du temps.
  if (has("boucle")) {
    const res = (await db.execute(sql`
      WITH per_ex AS (
        SELECT se.exercise_id, e.name, se.session_id, s.date, s.created_at,
               MAX(st.weight_kg) AS maxw
        FROM session_exercises se
        JOIN exercises e ON e.id = se.exercise_id
        JOIN sessions s ON s.id = se.session_id
        JOIN sets st ON st.session_exercise_id = se.id
        WHERE s.user_id = ${auth.userId} AND st.weight_kg IS NOT NULL
        GROUP BY se.exercise_id, e.name, se.session_id, s.date, s.created_at
      )
      SELECT name, date, maxw::float AS weight
      FROM (
        SELECT *,
          MAX(maxw) OVER (
            PARTITION BY exercise_id ORDER BY date, created_at
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
          ) AS prev_best
        FROM per_ex
      ) t
      WHERE prev_best IS NULL OR maxw > prev_best
      ORDER BY date DESC, created_at DESC
      LIMIT 100
    `)) as unknown as { rows?: unknown[] };
    payload.timeline = res.rows ?? res;
  }

  // Les Sept Têtes (Hydre) : tonnage par groupe musculaire.
  if (has("sept-tetes")) {
    const res = (await db.execute(sql`
      SELECT COALESCE(mg.g, 'Autre') AS muscle,
             SUM(st.weight_kg * st.reps)::float AS volume,
             COUNT(DISTINCT se.session_id)::int AS sessions
      FROM session_exercises se
      JOIN exercises e ON e.id = se.exercise_id
      JOIN sessions s ON s.id = se.session_id
      JOIN sets st ON st.session_exercise_id = se.id
      LEFT JOIN LATERAL unnest(COALESCE(e.muscle_groups, ARRAY[e.muscle_group])) AS mg(g) ON TRUE
      WHERE s.user_id = ${auth.userId} AND st.weight_kg IS NOT NULL
      GROUP BY mg.g
      ORDER BY volume DESC
    `)) as unknown as { rows?: unknown[] };
    payload.muscles = res.rows ?? res;
  }

  // Les Profondeurs (Léviathan) : les machines délaissées.
  if (has("profondeurs")) {
    const res = (await db.execute(sql`
      SELECT e.name,
             MAX(s.date) AS last_date,
             (CURRENT_DATE - MAX(s.date))::int AS days_ago
      FROM exercises e
      JOIN session_exercises se ON se.exercise_id = e.id
      JOIN sessions s ON s.id = se.session_id
      JOIN sets st ON st.session_exercise_id = se.id
      WHERE e.user_id = ${auth.userId}
      GROUP BY e.id, e.name
      HAVING (CURRENT_DATE - MAX(s.date))::int >= 10
      ORDER BY days_ago DESC
      LIMIT 20
    `)) as unknown as { rows?: unknown[] };
    payload.neglected = res.rows ?? res;
  }

  // Le Voyage (Celebi) : toi maintenant vs toi il y a six mois.
  if (has("voyage")) {
    const res = (await db.execute(sql`
      WITH recent AS (
        SELECT se.exercise_id, MAX(st.weight_kg)::float AS maxw
        FROM session_exercises se
        JOIN sessions s ON s.id = se.session_id
        JOIN sets st ON st.session_exercise_id = se.id
        WHERE s.user_id = ${auth.userId} AND s.date >= CURRENT_DATE - 60
          AND st.weight_kg IS NOT NULL
        GROUP BY se.exercise_id
      ),
      past AS (
        SELECT se.exercise_id, MAX(st.weight_kg)::float AS maxw
        FROM session_exercises se
        JOIN sessions s ON s.id = se.session_id
        JOIN sets st ON st.session_exercise_id = se.id
        WHERE s.user_id = ${auth.userId}
          AND s.date < CURRENT_DATE - 120
          AND st.weight_kg IS NOT NULL
        GROUP BY se.exercise_id
      )
      SELECT e.name, p.maxw AS before, r.maxw AS now,
             (r.maxw - p.maxw)::float AS delta
      FROM recent r
      JOIN past p ON p.exercise_id = r.exercise_id
      JOIN exercises e ON e.id = r.exercise_id
      ORDER BY delta DESC
    `)) as unknown as { rows?: unknown[] };
    payload.journey = res.rows ?? res;
  }

  // Le Regard (Basilic) : le Hall des records, gravé.
  if (has("regard")) {
    const res = (await db.execute(sql`
      SELECT DISTINCT ON (se.exercise_id)
        e.name, s.date, MAX(st.weight_kg)::float AS weight,
        SUM(st.weight_kg * st.reps)::float AS volume
      FROM session_exercises se
      JOIN exercises e ON e.id = se.exercise_id
      JOIN sessions s ON s.id = se.session_id
      JOIN sets st ON st.session_exercise_id = se.id
      WHERE s.user_id = ${auth.userId} AND st.weight_kg IS NOT NULL
      GROUP BY se.exercise_id, e.name, s.date, s.created_at, se.id
      ORDER BY se.exercise_id, MAX(st.weight_kg) DESC, s.date ASC
    `)) as unknown as { rows?: unknown[] };
    payload.hall = res.rows ?? res;
  }

  // La Carte du Ciel (Qilin) : chaque jour d'entraînement de l'année.
  if (has("presage")) {
    const res = (await db.execute(sql`
      SELECT DISTINCT date::text AS d FROM sessions
      WHERE user_id = ${auth.userId}
        AND tokens_granted_at IS NOT NULL
        AND date >= CURRENT_DATE - 365
      ORDER BY d
    `)) as unknown as { rows?: { d: string }[] };
    payload.yearmap = ((res.rows ?? res) as unknown as { d: string }[]).map((r) => r.d);
  }

  // Les Racines (Niðhöggr) : le volume de l'archive (l'export est à part).
  if (has("racines")) {
    const [row] = await db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(sessions)
      .where(eq(sessions.userId, auth.userId));
    payload.archive = { sessions: row?.n ?? 0 };
  }

  return Response.json(payload);
}
