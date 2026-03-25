import { db } from "@/lib/db";
import { sessions, sessionExercises, sets, exercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = parseInt(id);

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId));

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const exercisesWithSets = await db
    .select({
      sessionExerciseId: sessionExercises.id,
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      exerciseNameFr: exercises.nameFr,
      category: exercises.category,
      muscleGroup: exercises.muscleGroup,
      sortOrder: sessionExercises.sortOrder,
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

  // Group by exercise
  const grouped: Record<
    number,
    {
      sessionExerciseId: number;
      exerciseId: number;
      name: string;
      nameFr: string;
      category: string;
      muscleGroup: string | null;
      sets: { id: number; setNumber: number; weightKg: number; reps: number }[];
    }
  > = {};

  for (const row of exercisesWithSets) {
    if (!grouped[row.sessionExerciseId]) {
      grouped[row.sessionExerciseId] = {
        sessionExerciseId: row.sessionExerciseId,
        exerciseId: row.exerciseId,
        name: row.exerciseName,
        nameFr: row.exerciseNameFr,
        category: row.category,
        muscleGroup: row.muscleGroup,
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

  return Response.json({
    ...session,
    exercises: Object.values(grouped),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(sessions).where(eq(sessions.id, parseInt(id)));
  return Response.json({ ok: true });
}
