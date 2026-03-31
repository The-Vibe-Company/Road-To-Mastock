import { db } from "@/lib/db";
import { sessionExercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const update: Record<string, unknown> = {};
  if (body.locked !== undefined) update.locked = body.locked;
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.sortOrder !== undefined) update.sortOrder = body.sortOrder;

  const [updated] = await db
    .update(sessionExercises)
    .set(update)
    .where(eq(sessionExercises.id, parseInt(id)))
    .returning();

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db
    .delete(sessionExercises)
    .where(eq(sessionExercises.id, parseInt(id)));
  return Response.json({ ok: true });
}
