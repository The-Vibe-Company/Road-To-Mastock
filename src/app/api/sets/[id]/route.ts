import { db } from "@/lib/db";
import { sets, sessionExercises, exercises } from "@/lib/db/schema";
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
    .select({ kind: exercises.kind })
    .from(sets)
    .innerJoin(sessionExercises, eq(sets.sessionExerciseId, sessionExercises.id))
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(eq(sets.id, setId));

  const isCardio = meta?.kind === "cardio";

  const [result] = await db
    .update(sets)
    .set(
      isCardio
        ? {
            durationMinutes: body.durationMinutes ?? null,
            calories: body.calories ?? null,
            distanceKm: body.distanceKm ?? null,
            avgSpeedKmh: body.avgSpeedKmh ?? null,
            resistanceLevel: body.resistanceLevel ?? null,
          }
        : {
            weightKg: body.weightKg,
            reps: body.reps,
          },
    )
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
