import { db } from "@/lib/db";
import { sets, sessionExercises, exerciseWeights } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function POST(request: Request) {
  const body = await request.json();

  // Get exercise ID + auto-increment set number in parallel
  const [countResult, [seRow]] = await Promise.all([
    db.select({ value: count() }).from(sets).where(eq(sets.sessionExerciseId, body.sessionExerciseId)),
    db.select({ exerciseId: sessionExercises.exerciseId }).from(sessionExercises).where(eq(sessionExercises.id, body.sessionExerciseId)),
  ]);

  const [result] = await db
    .insert(sets)
    .values({
      sessionExerciseId: body.sessionExerciseId,
      setNumber: countResult[0].value + 1,
      weightKg: body.weightKg,
      reps: body.reps,
    })
    .returning();

  // Auto-save weight if new for this exercise (fire and forget)
  if (seRow && body.weightKg > 0) {
    db.insert(exerciseWeights)
      .values({ exerciseId: seRow.exerciseId, weightKg: body.weightKg })
      .onConflictDoNothing()
      .then(() => {});
  }

  return Response.json(result, { status: 201 });
}
