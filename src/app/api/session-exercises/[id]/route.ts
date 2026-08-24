import { db } from "@/lib/db";
import { sessionExercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { notFound, ownsSessionExercise, unauthorized } from "@/lib/ownership";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return unauthorized();

  const { id } = await params;
  if (!(await ownsSessionExercise(parseInt(id), auth.userId))) return notFound();

  const body = await request.json();

  const update: Partial<typeof sessionExercises.$inferInsert> = {};
  if (body.locked !== undefined) update.locked = body.locked;
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.sortOrder !== undefined) update.sortOrder = Number(body.sortOrder);
  // Changer de salle en cours de séance : records, paliers et dernière perf
  // suivent la nouvelle version.
  if (body.variantId !== undefined) {
    update.variantId = body.variantId === null ? null : Number(body.variantId);
  }

  const [updated] = await db
    .update(sessionExercises)
    .set(update)
    .where(eq(sessionExercises.id, parseInt(id)))
    .returning();

  revalidatePath("/");
  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return unauthorized();

  const { id } = await params;
  if (!(await ownsSessionExercise(parseInt(id), auth.userId))) return notFound();

  await db
    .delete(sessionExercises)
    .where(eq(sessionExercises.id, parseInt(id)));
  revalidatePath("/");
  return Response.json({ ok: true });
}
