import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { resolveMuscleGroups } from "@/lib/muscle-groups";

function normalizeGroups(input: unknown): string[] | undefined {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) return undefined;
  return input
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, string | string[] | null> = {};
  if (body.name?.trim()) updates.name = body.name.trim();

  const groups = normalizeGroups(body.muscleGroups);
  if (groups !== undefined) {
    updates.muscleGroups = groups;
    updates.muscleGroup = groups[0] ?? null;
  } else if (body.muscleGroup !== undefined) {
    const single = body.muscleGroup?.trim() || null;
    updates.muscleGroup = single;
    updates.muscleGroups = single ? [single] : [];
  }

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

  const ug = resolveMuscleGroups(updated.muscleGroups, updated.muscleGroup);
  return Response.json({
    id: updated.id,
    name: updated.name,
    muscleGroup: ug[0] ?? null,
    muscleGroups: ug,
  });
}
