import { db } from "@/lib/db";
import { sessions, sessionExercises, sets, exercises } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

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
      muscleGroup: exercises.muscleGroup,
      sortOrder: sessionExercises.sortOrder,
      locked: sessionExercises.locked,
      setId: sets.id,
      setNumber: sets.setNumber,
      weightKg: sets.weightKg,
      reps: sets.reps,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .leftJoin(sets, eq(sets.sessionExerciseId, sessionExercises.id))
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(sessionExercises.sortOrder, sets.setNumber);

  const grouped: Record<
    number,
    {
      sessionExerciseId: number;
      exerciseId: number;
      name: string;
      muscleGroup: string | null;
      locked: boolean;
      sets: { id: number; setNumber: number; weightKg: number; reps: number }[];
    }
  > = {};

  for (const row of exercisesWithSets) {
    if (!grouped[row.sessionExerciseId]) {
      grouped[row.sessionExerciseId] = {
        sessionExerciseId: row.sessionExerciseId,
        exerciseId: row.exerciseId,
        name: row.exerciseName,
        muscleGroup: row.muscleGroup,
        locked: row.locked,
        sets: [],
      };
    }
    if (row.setId) {
      grouped[row.sessionExerciseId].sets.push({
        id: row.setId,
        setNumber: row.setNumber!,
        weightKg: row.weightKg!,
        reps: row.reps!,
      });
    }
  }

  const exerciseList = Object.values(grouped);
  const exerciseIds = [...new Set(exerciseList.map((e) => e.exerciseId))];

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

  if (!body.date) {
    return Response.json({ error: "Date is required" }, { status: 400 });
  }

  const [updated] = await db
    .update(sessions)
    .set({ date: body.date })
    .where(and(eq(sessions.id, parseInt(id)), eq(sessions.userId, auth.userId)))
    .returning();

  if (!updated) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

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

  return Response.json({ ok: true });
}
