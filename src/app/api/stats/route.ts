import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = auth.userId;

  // All queries in parallel
  const [summaryRes, weeklyRes, topExercisesRes, muscleRes, datesRes] = await Promise.all([
    // Summary stats
    db.execute(sql`
      SELECT
        COUNT(*)::int AS total_sessions,
        COALESCE(SUM(sub.vol), 0) AS total_volume
      FROM sessions s
      LEFT JOIN LATERAL (
        SELECT SUM(st.weight_kg * st.reps) AS vol
        FROM sets st
        JOIN session_exercises se ON se.id = st.session_exercise_id
        WHERE se.session_id = s.id
      ) sub ON true
      WHERE s.user_id = ${userId}
    `),

    // Weekly volumes (last 8 weeks)
    db.execute(sql`
      SELECT
        DATE_TRUNC('week', s.date::timestamp)::date AS week_start,
        COALESCE(SUM(st.weight_kg * st.reps), 0) AS volume
      FROM sessions s
      JOIN session_exercises se ON se.session_id = s.id
      JOIN sets st ON st.session_exercise_id = se.id
      WHERE s.user_id = ${userId}
        AND s.date >= (CURRENT_DATE - INTERVAL '8 weeks')
      GROUP BY DATE_TRUNC('week', s.date::timestamp)
      ORDER BY week_start
    `),

    // Top 3 exercises by max weight
    db.execute(sql`
      SELECT
        e.name,
        MAX(st.weight_kg) AS max_weight,
        (SELECT s2.date FROM sessions s2
         JOIN session_exercises se2 ON se2.session_id = s2.id
         JOIN sets st2 ON st2.session_exercise_id = se2.id
         WHERE se2.exercise_id = e.id AND s2.user_id = ${userId}
         ORDER BY st2.weight_kg DESC LIMIT 1
        ) AS date
      FROM exercises e
      JOIN session_exercises se ON se.exercise_id = e.id
      JOIN sessions s ON s.id = se.session_id
      JOIN sets st ON st.session_exercise_id = se.id
      WHERE s.user_id = ${userId}
      GROUP BY e.id, e.name
      ORDER BY max_weight DESC
      LIMIT 3
    `),

    // Muscle distribution
    db.execute(sql`
      SELECT
        COALESCE(e.muscle_group, 'Autre') AS muscle_group,
        COUNT(st.id)::int AS set_count
      FROM sets st
      JOIN session_exercises se ON se.id = st.session_exercise_id
      JOIN sessions s ON s.id = se.session_id
      JOIN exercises e ON e.id = se.exercise_id
      WHERE s.user_id = ${userId}
      GROUP BY e.muscle_group
      ORDER BY set_count DESC
    `),

    // All session dates for streak calculation
    db.execute(sql`
      SELECT DISTINCT date FROM sessions
      WHERE user_id = ${userId}
      ORDER BY date DESC
    `),
  ]);

  const summary = ((summaryRes.rows ?? summaryRes) as unknown as { total_sessions: number; total_volume: number }[])[0];
  const weeklyVolumes = (weeklyRes.rows ?? weeklyRes) as unknown as { week_start: string; volume: number }[];
  const topExercises = (topExercisesRes.rows ?? topExercisesRes) as unknown as { name: string; max_weight: number; date: string }[];
  const muscleDistribution = (muscleRes.rows ?? muscleRes) as unknown as { muscle_group: string; set_count: number }[];
  const dates = (datesRes.rows ?? datesRes) as unknown as { date: string }[];

  // Calculate streak
  let streak = 0;
  if (dates.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sortedDates = dates.map((d) => {
      const dt = new Date(d.date);
      dt.setHours(0, 0, 0, 0);
      return dt.getTime();
    });

    // Check if the most recent session is today or yesterday
    const diffFirst = Math.floor((today.getTime() - sortedDates[0]) / 86400000);
    if (diffFirst <= 1) {
      streak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = Math.floor((sortedDates[i - 1] - sortedDates[i]) / 86400000);
        if (diff === 1) {
          streak++;
        } else if (diff === 0) {
          continue; // same day
        } else {
          break;
        }
      }
    }
  }

  const lastSessionDate = dates.length > 0 ? dates[0].date : null;
  const daysSinceLastSession = lastSessionDate
    ? Math.floor((Date.now() - new Date(lastSessionDate).getTime()) / 86400000)
    : null;

  return Response.json({
    totalSessions: Number(summary.total_sessions),
    totalVolume: Math.round(Number(summary.total_volume)),
    streak,
    lastSessionDate,
    daysSinceLastSession,
    weeklyVolumes: weeklyVolumes.map((w) => ({
      week: w.week_start,
      volume: Math.round(Number(w.volume)),
    })),
    topExercises: topExercises.map((e) => ({
      name: e.name,
      maxWeight: Number(e.max_weight),
      date: e.date,
    })),
    muscleDistribution: muscleDistribution.map((m) => ({
      muscleGroup: m.muscle_group,
      setCount: Number(m.set_count),
    })),
  });
}
