import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, string | null> = {};
  if (body.name?.trim()) updates.name = body.name.trim();
  if (body.muscleGroup !== undefined) updates.muscleGroup = body.muscleGroup?.trim() || null;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(exercises)
    .set(updates)
    .where(eq(exercises.id, parseInt(id)))
    .returning();

  if (!updated) {
    return Response.json({ error: "Exercise not found" }, { status: 404 });
  }

  return Response.json(updated);
}
