import { db } from "@/lib/db";
import { sets, sessionExercises, exercises, exerciseWeights } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const body = await request.json();

  const [countResult, [seRow]] = await Promise.all([
    db.select({ value: count() }).from(sets).where(eq(sets.sessionExerciseId, body.sessionExerciseId)),
    db
      .select({ exerciseId: sessionExercises.exerciseId, kind: exercises.kind })
      .from(sessionExercises)
      .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
      .where(eq(sessionExercises.id, body.sessionExerciseId)),
  ]);

  const isCardio = seRow?.kind === "cardio";

  const [result] = await db
    .insert(sets)
    .values({
      sessionExerciseId: body.sessionExerciseId,
      setNumber: countResult[0].value + 1,
      weightKg: isCardio ? null : body.weightKg,
      reps: isCardio ? null : body.reps,
      durationMinutes: isCardio ? body.durationMinutes ?? null : null,
      calories: isCardio ? body.calories ?? null : null,
      distanceKm: isCardio ? body.distanceKm ?? null : null,
      avgSpeedKmh: isCardio ? body.avgSpeedKmh ?? null : null,
      resistanceLevel: isCardio ? body.resistanceLevel ?? null : null,
    })
    .returning();

  if (!isCardio && seRow && body.weightKg > 0) {
    db.insert(exerciseWeights)
      .values({ exerciseId: seRow.exerciseId, weightKg: body.weightKg })
      .onConflictDoNothing()
      .then(() => {});
  }

  revalidatePath("/");
  return Response.json(result, { status: 201 });
}
