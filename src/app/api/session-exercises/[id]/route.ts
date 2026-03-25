import { db } from "@/lib/db";
import { sessionExercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
