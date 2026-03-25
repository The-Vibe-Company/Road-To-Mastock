import { db } from "@/lib/db";
import { sets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const [result] = await db
    .update(sets)
    .set({
      weightKg: body.weightKg,
      reps: body.reps,
    })
    .where(eq(sets.id, parseInt(id)))
    .returning();

  return Response.json(result);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(sets).where(eq(sets.id, parseInt(id)));
  return Response.json({ ok: true });
}
