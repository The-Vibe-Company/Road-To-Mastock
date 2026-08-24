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
import { getAuthUser } from "@/lib/auth";
import { notFound, ownsSessionExercise, unauthorized } from "@/lib/ownership";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return unauthorized();

  const body = await request.json();

  if (!(await ownsSessionExercise(Number(body.sessionExerciseId), auth.userId))) {
    return notFound();
  }

  const [countResult, [seRow]] = await Promise.all([
    db.select({ value: count() }).from(sets).where(eq(sets.sessionExerciseId, body.sessionExerciseId)),
    db
      .select({
        exerciseId: sessionExercises.exerciseId,
        sessionId: sessionExercises.sessionId,
        variantId: sessionExercises.variantId,
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
      // Le palier est rattache a la version utilisee ce jour-la : les plaques
      // d'une salle ne valent pas pour l'autre.
      .values({
        exerciseId: seRow.exerciseId,
        variantId: seRow.variantId ?? null,
        weightKg: body.weightKg,
      })
      .onConflictDoNothing()
      .then(() => {});
  }

  revalidatePath("/");
  return Response.json(result, { status: 201 });
}
