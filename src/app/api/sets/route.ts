import { db } from "@/lib/db";
import {
  sets,
  sessionExercises,
  exercises,
  exerciseWeights,
  sessions,
} from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const body = await request.json();

  const [countResult, [seRow]] = await Promise.all([
    db.select({ value: count() }).from(sets).where(eq(sets.sessionExerciseId, body.sessionExerciseId)),
    db
      .select({
        exerciseId: sessionExercises.exerciseId,
        sessionId: sessionExercises.sessionId,
        kind: exercises.kind,
        isAssisted: exercises.isAssisted,
      })
      .from(sessionExercises)
      .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
      .where(eq(sessionExercises.id, body.sessionExerciseId)),
  ]);

  const isCardio = seRow?.kind === "cardio";
  const isAssisted = !isCardio && (seRow?.isAssisted ?? false);

  let weightKg: number | null = isCardio ? null : (typeof body.weightKg === "number" ? body.weightKg : null);
  let assistanceKg: number | null = null;

  if (isAssisted) {
    const [session] = await db
      .select({ bodyweightKg: sessions.bodyweightKg })
      .from(sessions)
      .where(eq(sessions.id, seRow!.sessionId));
    const bw = session?.bodyweightKg;
    if (bw == null) {
      return Response.json(
        { error: "Renseigne ton poids de corps avant d'enregistrer un exo assisté." },
        { status: 400 },
      );
    }
    const a = typeof body.assistanceKg === "number" ? body.assistanceKg : null;
    if (a == null || a < 0) {
      return Response.json({ error: "Aide invalide" }, { status: 400 });
    }
    assistanceKg = a;
    weightKg = Math.max(0, Number((bw - a).toFixed(2)));
  }

  const [result] = await db
    .insert(sets)
    .values({
      sessionExerciseId: body.sessionExerciseId,
      setNumber: countResult[0].value + 1,
      weightKg,
      reps: isCardio ? null : body.reps,
      durationMinutes: isCardio ? body.durationMinutes ?? null : null,
      calories: isCardio ? body.calories ?? null : null,
      distanceKm: isCardio ? body.distanceKm ?? null : null,
      avgSpeedKmh: isCardio ? body.avgSpeedKmh ?? null : null,
      resistanceLevel: isCardio ? body.resistanceLevel ?? null : null,
      assistanceKg,
    })
    .returning();

  // Auto-save weight in known weights only for plain muscu (not assisted —
  // these vary with bodyweight and are derived).
  if (!isCardio && !isAssisted && seRow && typeof body.weightKg === "number" && body.weightKg > 0) {
    db.insert(exerciseWeights)
      .values({ exerciseId: seRow.exerciseId, weightKg: body.weightKg })
      .onConflictDoNothing()
      .then(() => {});
  }

  revalidatePath("/");
  return Response.json(result, { status: 201 });
}
