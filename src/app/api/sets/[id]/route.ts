import { db } from "@/lib/db";
import { sets, sessionExercises, exercises, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const setId = parseInt(id);

  const [meta] = await db
    .select({
      kind: exercises.kind,
      isAssisted: exercises.isAssisted,
      sessionId: sessionExercises.sessionId,
    })
    .from(sets)
    .innerJoin(sessionExercises, eq(sets.sessionExerciseId, sessionExercises.id))
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(eq(sets.id, setId));

  const isCardio = meta?.kind === "cardio";
  const isAssisted = !isCardio && (meta?.isAssisted ?? false);

  let updateValues: Partial<typeof sets.$inferInsert>;

  if (isCardio) {
    updateValues = {
      durationMinutes: body.durationMinutes ?? null,
      calories: body.calories ?? null,
      distanceKm: body.distanceKm ?? null,
      avgSpeedKmh: body.avgSpeedKmh ?? null,
      resistanceLevel: body.resistanceLevel ?? null,
    };
  } else if (isAssisted) {
    const [session] = await db
      .select({ bodyweightKg: sessions.bodyweightKg })
      .from(sessions)
      .where(eq(sessions.id, meta!.sessionId));
    const bw = session?.bodyweightKg;
    if (bw == null) {
      return Response.json(
        { error: "Renseigne ton poids de corps avant de modifier un exo assisté." },
        { status: 400 },
      );
    }
    const a = typeof body.assistanceKg === "number" ? body.assistanceKg : null;
    if (a == null || a < 0) {
      return Response.json({ error: "Aide invalide" }, { status: 400 });
    }
    updateValues = {
      reps: body.reps,
      assistanceKg: a,
      weightKg: Math.max(0, Number((bw - a).toFixed(2))),
    };
  } else {
    updateValues = {
      weightKg: body.weightKg,
      reps: body.reps,
    };
  }

  const [result] = await db
    .update(sets)
    .set(updateValues)
    .where(eq(sets.id, setId))
    .returning();

  revalidatePath("/");
  return Response.json(result);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(sets).where(eq(sets.id, parseInt(id)));
  revalidatePath("/");
  return Response.json({ ok: true });
}
