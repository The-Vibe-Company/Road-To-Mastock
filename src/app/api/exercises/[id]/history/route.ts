import { db } from "@/lib/db";
import { exercises, sessions, sessionExercises, sets } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { resolveMuscleGroups } from "@/lib/muscle-groups";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const exerciseId = parseInt(id);

  const [exercise] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, exerciseId));

  if (!exercise) {
    return Response.json({ error: "Exercise not found" }, { status: 404 });
  }

  const rows = await db
    .select({
      date: sessions.date,
      sessionId: sessions.id,
      bodyweightKg: sessions.bodyweightKg,
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
    .innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
    .innerJoin(sets, eq(sets.sessionExerciseId, sessionExercises.id))
    .where(
      and(
        eq(sessionExercises.exerciseId, exerciseId),
        eq(sessions.userId, auth.userId)
      )
    )
    .orderBy(asc(sessions.date), asc(sets.setNumber));

  type SetEntry = {
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

  const bySession: Record<
    string,
    { date: string; sessionId: number; bodyweightKg: number | null; sets: SetEntry[] }
  > = {};

  for (const row of rows) {
    const key = `${row.sessionId}`;
    if (!bySession[key]) {
      bySession[key] = {
        date: row.date,
        sessionId: row.sessionId,
        bodyweightKg: row.bodyweightKg,
        sets: [],
      };
    }
    bySession[key].sets.push({
      setNumber: row.setNumber,
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

  const history = Object.values(bySession);

  const groups = resolveMuscleGroups(exercise.muscleGroups, exercise.muscleGroup);
  return Response.json({
    exercise: {
      id: exercise.id,
      name: exercise.name,
      kind: exercise.kind ?? "muscu",
      isAssisted: exercise.isAssisted ?? false,
      muscleGroup: groups[0] ?? null,
      muscleGroups: groups,
    },
    history,
  });
}
