import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = auth.userId;

  // All queries in parallel
  const [summaryRes, weeklyRes, topExercisesRes, muscleRes, datesRes, sparklineRes, suggestionsRes, muscleWeeklyRes] = await Promise.all([
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

    // All exercises by name with max weight
    db.execute(sql`
      SELECT
        e.name,
        MAX(st.weight_kg) AS max_weight,
        COALESCE(SUM(st.weight_kg * st.reps), 0) AS total_volume,
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
      ORDER BY e.name ASC
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

    // All session dates for streak + heatmap
    db.execute(sql`
      SELECT DISTINCT date FROM sessions
      WHERE user_id = ${userId}
      ORDER BY date DESC
    `),

    // Sparklines: last 8 max weights per exercise
    db.execute(sql`
      SELECT e.name, s.date, MAX(st.weight_kg) AS max_weight
      FROM exercises e
      JOIN session_exercises se ON se.exercise_id = e.id
      JOIN sessions s ON s.id = se.session_id
      JOIN sets st ON st.session_exercise_id = se.id
      WHERE s.user_id = ${userId}
      GROUP BY e.name, s.date, se.id
      ORDER BY e.name, s.date DESC
    `),

    // Suggestions: last session date per muscle group
    db.execute(sql`
      SELECT
        COALESCE(e.muscle_group, 'Autre') AS muscle_group,
        MAX(s.date) AS last_date
      FROM exercises e
      JOIN session_exercises se ON se.exercise_id = e.id
      JOIN sessions s ON s.id = se.session_id
      WHERE s.user_id = ${userId}
      GROUP BY e.muscle_group
      ORDER BY last_date ASC
    `),

    // Muscle volume over time (last 8 weeks)
    db.execute(sql`
      SELECT
        DATE_TRUNC('week', s.date::timestamp)::date AS week_start,
        COALESCE(e.muscle_group, 'Autre') AS muscle_group,
        COALESCE(SUM(st.weight_kg * st.reps), 0) AS volume
      FROM sessions s
      JOIN session_exercises se ON se.session_id = s.id
      JOIN exercises e ON e.id = se.exercise_id
      JOIN sets st ON st.session_exercise_id = se.id
      WHERE s.user_id = ${userId}
        AND s.date >= (CURRENT_DATE - INTERVAL '8 weeks')
      GROUP BY DATE_TRUNC('week', s.date::timestamp), e.muscle_group
      ORDER BY week_start, muscle_group
    `),
  ]);

  const summary = ((summaryRes.rows ?? summaryRes) as unknown as { total_sessions: number; total_volume: number }[])[0];
  const weeklyVolumes = (weeklyRes.rows ?? weeklyRes) as unknown as { week_start: string; volume: number }[];
  const topExercises = (topExercisesRes.rows ?? topExercisesRes) as unknown as { name: string; max_weight: number; total_volume: number; date: string }[];
  const muscleDistribution = (muscleRes.rows ?? muscleRes) as unknown as { muscle_group: string; set_count: number }[];
  const dates = (datesRes.rows ?? datesRes) as unknown as { date: string }[];
  const sparklineRows = (sparklineRes.rows ?? sparklineRes) as unknown as { name: string; max_weight: number }[];
  const suggestionRows = (suggestionsRes.rows ?? suggestionsRes) as unknown as { muscle_group: string; last_date: string }[];
  const muscleWeeklyRows = (muscleWeeklyRes.rows ?? muscleWeeklyRes) as unknown as { week_start: string; muscle_group: string; volume: number }[];

  // Build sparklines: last 8 values per exercise
  const sparklines: Record<string, number[]> = {};
  for (const row of sparklineRows) {
    if (!sparklines[row.name]) sparklines[row.name] = [];
    if (sparklines[row.name].length < 8) {
      sparklines[row.name].push(Number(row.max_weight));
    }
  }
  // Reverse so oldest first (for left-to-right chart)
  for (const key of Object.keys(sparklines)) {
    sparklines[key].reverse();
  }

  // Suggestions: muscles not worked in > 7 days
  const today = new Date();
  const suggestions = suggestionRows
    .map((r) => ({
      muscleGroup: r.muscle_group,
      daysSince: Math.floor((today.getTime() - new Date(r.last_date).getTime()) / 86400000),
    }))
    .filter((s) => s.daysSince > 7)
    .sort((a, b) => b.daysSince - a.daysSince);

  // Muscle volume over time
  const muscleVolumeOverTime: Record<string, { week: string; volume: number }[]> = {};
  for (const row of muscleWeeklyRows) {
    const mg = row.muscle_group;
    if (!muscleVolumeOverTime[mg]) muscleVolumeOverTime[mg] = [];
    muscleVolumeOverTime[mg].push({
      week: row.week_start,
      volume: Math.round(Number(row.volume)),
    });
  }

  // Calculate weekly streak (consecutive ISO weeks with at least one session)
  let streak = 0;
  if (dates.length > 0) {
    // ISO week number: weeks start on Monday
    const getISOWeekKey = (dateStr: string) => {
      const parts = dateStr.split("-");
      const d = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
      const dayOfWeek = d.getUTCDay() || 7; // Monday=1 ... Sunday=7
      d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek); // Thursday of the week
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      return d.getUTCFullYear() * 100 + weekNo; // e.g. 202613
    };

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const currentWeekKey = getISOWeekKey(todayStr);

    const sessionWeekKeys = [...new Set(dates.map((d) => getISOWeekKey(d.date)))].sort((a, b) => b - a);

    // Check if most recent session is this week or last week
    if (sessionWeekKeys[0] >= currentWeekKey - 1) {
      streak = 1;
      for (let i = 1; i < sessionWeekKeys.length; i++) {
        const diff = sessionWeekKeys[i - 1] - sessionWeekKeys[i];
        // diff=1 means consecutive weeks (handles year boundary approximately)
        if (diff === 1) {
          streak++;
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
      totalVolume: Math.round(Number(e.total_volume)),
      date: e.date,
    })),
    muscleDistribution: muscleDistribution.map((m) => ({
      muscleGroup: m.muscle_group,
      setCount: Number(m.set_count),
    })),
    sessionDates: dates.map((d) => d.date),
    sparklines,
    suggestions,
    muscleVolumeOverTime,
  });
}
