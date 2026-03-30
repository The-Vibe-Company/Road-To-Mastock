import { db } from "@/lib/db";
import { sessionExercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(sessionExercises)
    .set({ locked: body.locked })
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
