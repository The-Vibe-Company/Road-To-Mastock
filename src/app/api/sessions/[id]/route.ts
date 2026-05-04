import { db } from "@/lib/db";
import { sessions, sessionExercises, sets, exercises, exerciseWeights } from "@/lib/db/schema";
import { eq, and, sql, inArray, asc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { resolveMuscleGroups } from "@/lib/muscle-groups";
import { revalidatePath } from "next/cache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sessionId = parseInt(id);

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, auth.userId)));

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const exercisesWithSets = await db
    .select({
      sessionExerciseId: sessionExercises.id,
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      kind: exercises.kind,
      isAssisted: exercises.isAssisted,
      muscleGroup: exercises.muscleGroup,
      muscleGroups: exercises.muscleGroups,
      sortOrder: sessionExercises.sortOrder,
      locked: sessionExercises.locked,
      notes: sessionExercises.notes,
      setId: sets.id,
      setNumber: sets.setNumber,
      weightKg: sets.weightKg,
      reps: sets.reps,
      durationMinutes: sets.durationMinutes,
      calories: sets.calories,
      distanceKm: sets.distanceKm,
      avgSpeedKmh: sets.avgSpeedKmh,
      resistanceLevel: sets.resistanceLevel,
      assistanceKg: sets.assistanceKg,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .leftJoin(sets, eq(sets.sessionExerciseId, sessionExercises.id))
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(sessionExercises.sortOrder, sets.setNumber);

  type SetEntry = {
    id: number;
    setNumber: number;
    weightKg: number | null;
    reps: number | null;
    durationMinutes: number | null;
    calories: number | null;
    distanceKm: number | null;
    avgSpeedKmh: number | null;
    resistanceLevel: number | null;
    assistanceKg: number | null;
  };

  const grouped = new Map<
    number,
    {
      sessionExerciseId: number;
      exerciseId: number;
      name: string;
      kind: string;
      isAssisted: boolean;
      muscleGroup: string | null;
      muscleGroups: string[];
      sortOrder: number;
      locked: boolean;
      notes: string | null;
      sets: SetEntry[];
    }
  >();

  for (const row of exercisesWithSets) {
    if (!grouped.has(row.sessionExerciseId)) {
      const groups = resolveMuscleGroups(row.muscleGroups, row.muscleGroup);
      grouped.set(row.sessionExerciseId, {
        sessionExerciseId: row.sessionExerciseId,
        exerciseId: row.exerciseId,
        name: row.exerciseName,
        kind: row.kind ?? "muscu",
        isAssisted: row.isAssisted ?? false,
        muscleGroup: groups[0] ?? null,
        muscleGroups: groups,
        sortOrder: row.sortOrder ?? 0,
        locked: row.locked,
        notes: row.notes,
        sets: [],
      });
    }
    if (row.setId) {
      grouped.get(row.sessionExerciseId)!.sets.push({
        id: row.setId,
        setNumber: row.setNumber!,
        weightKg: row.weightKg,
        reps: row.reps,
        durationMinutes: row.durationMinutes,
        calories: row.calories,
        distanceKm: row.distanceKm,
        avgSpeedKmh: row.avgSpeedKmh,
        resistanceLevel: row.resistanceLevel,
        assistanceKg: row.assistanceKg,
      });
    }
  }

  const exerciseList = [...grouped.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  const exerciseIds = [...new Set(exerciseList.map((e) => e.exerciseId))];
  const muscuExerciseIds = [...new Set(exerciseList.filter((e) => e.kind !== "cardio").map((e) => e.exerciseId))];

  // Fetch last session's sets for each muscu exercise (previous performance).
  // Cardio doesn't surface a "last perf" panel.
  const lastPerf: Record<number, { date: string; sets: { weightKg: number; reps: number }[] }> = {};

  if (muscuExerciseIds.length > 0) {
    const lastPerfRows = (await db.execute(sql`
      WITH last_se AS (
        SELECT DISTINCT ON (se.exercise_id)
          se.id AS se_id,
          se.exercise_id,
          s.date
        FROM session_exercises se
        JOIN sessions s ON s.id = se.session_id
        WHERE se.exercise_id IN (${sql.join(muscuExerciseIds.map(id => sql`${id}`), sql`, `)})
          AND s.user_id = ${auth.userId}
          AND se.session_id != ${sessionId}
        ORDER BY se.exercise_id, s.date DESC, s.created_at DESC
      )
      SELECT
        lse.exercise_id,
        lse.date,
        st.weight_kg,
        st.reps,
        st.set_number
      FROM last_se lse
      JOIN sets st ON st.session_exercise_id = lse.se_id
      WHERE st.weight_kg IS NOT NULL
      ORDER BY lse.exercise_id, st.set_number
    `)) as unknown as { rows?: any[] };

    const rows = (lastPerfRows.rows ?? lastPerfRows) as unknown as {
      exercise_id: number; date: string; weight_kg: number; reps: number; set_number: number;
    }[];

    for (const row of rows) {
      if (!lastPerf[row.exercise_id]) {
        lastPerf[row.exercise_id] = { date: row.date, sets: [] };
      }
      lastPerf[row.exercise_id].sets.push({
        weightKg: Number(row.weight_kg),
        reps: Number(row.reps),
      });
    }
  }

  // Compute rankings for each exercise (max weight & total volume across all user sessions)
  const rankings: Record<number, { weightRank: number | null; volumeRank: number | null }> = {};

  if (exerciseIds.length > 0) {
    const rankRows = (await db.execute(sql`
      WITH exercise_stats AS (
        SELECT
          se.id AS se_id,
          se.exercise_id,
          COALESCE(MAX(st.weight_kg), 0) AS max_weight,
          COALESCE(SUM(st.weight_kg * st.reps), 0) AS total_volume
        FROM session_exercises se
        JOIN sessions s ON s.id = se.session_id
        LEFT JOIN sets st ON st.session_exercise_id = se.id
        WHERE se.exercise_id IN (${sql.join(exerciseIds.map(id => sql`${id}`), sql`, `)})
          AND s.user_id = ${auth.userId}
        GROUP BY se.id, se.exercise_id
      ),
      ranked AS (
        SELECT
          se_id,
          exercise_id,
          RANK() OVER (PARTITION BY exercise_id ORDER BY max_weight DESC) AS weight_rank,
          RANK() OVER (PARTITION BY exercise_id ORDER BY total_volume DESC) AS volume_rank
        FROM exercise_stats
        WHERE max_weight > 0
      )
      SELECT * FROM ranked
      WHERE se_id IN (${sql.join(exerciseList.map(e => sql`${e.sessionExerciseId}`), sql`, `)})
    `)) as unknown as { rows?: { se_id: number; weight_rank: number; volume_rank: number }[] };

    const rows = (rankRows.rows ?? rankRows) as unknown as { se_id: number; weight_rank: number; volume_rank: number }[];
    for (const row of rows) {
      rankings[row.se_id] = {
        weightRank: Number(row.weight_rank),
        volumeRank: Number(row.volume_rank),
      };
    }
  }

  // Fetch known weights per exercise
  const knownWeightsMap: Record<number, number[]> = {};
  if (exerciseIds.length > 0) {
    const weightRows = await db
      .select({ exerciseId: exerciseWeights.exerciseId, weightKg: exerciseWeights.weightKg })
      .from(exerciseWeights)
      .where(inArray(exerciseWeights.exerciseId, exerciseIds))
      .orderBy(asc(exerciseWeights.weightKg));
    for (const row of weightRows) {
      if (!knownWeightsMap[row.exerciseId]) knownWeightsMap[row.exerciseId] = [];
      knownWeightsMap[row.exerciseId].push(row.weightKg);
    }
  }

  return Response.json({
    ...session,
    exercises: exerciseList.map((e) => ({
      ...e,
      record: rankings[e.sessionExerciseId]
        ? Math.min(
            rankings[e.sessionExerciseId].weightRank ?? 999,
            rankings[e.sessionExerciseId].volumeRank ?? 999
          )
        : null,
      lastPerf: lastPerf[e.exerciseId] || null,
      knownWeights: knownWeightsMap[e.exerciseId] || [],
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updates: Partial<typeof sessions.$inferInsert> = {};
  if (typeof body.date === "string" && body.date) updates.date = body.date;
  if ("bodyweightKg" in body) {
    const v = body.bodyweightKg;
    updates.bodyweightKg = v == null ? null : Number(v);
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(sessions)
    .set(updates)
    .where(and(eq(sessions.id, parseInt(id)), eq(sessions.userId, auth.userId)))
    .returning();

  if (!updated) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  revalidatePath("/");
  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db
    .delete(sessions)
    .where(and(eq(sessions.id, parseInt(id)), eq(sessions.userId, auth.userId)));

  revalidatePath("/");
  return Response.json({ ok: true });
}
