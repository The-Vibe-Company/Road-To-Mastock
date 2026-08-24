import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { resolveMuscleGroups } from "@/lib/muscle-groups";

function normalizeGroups(input: unknown): string[] | undefined {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) return undefined;
  const cleaned = input
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
  return Array.from(new Set(cleaned));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, string | string[] | boolean | null> = {};
  if (body.name?.trim()) updates.name = body.name.trim();
  if (typeof body.hasVariants === "boolean") updates.hasVariants = body.hasVariants;

  const groups = normalizeGroups(body.muscleGroups);
  if (groups !== undefined) {
    updates.muscleGroups = groups;
    updates.muscleGroup = groups[0] ?? null;
  } else if (body.muscleGroup === null) {
    updates.muscleGroup = null;
    updates.muscleGroups = [];
  } else if (typeof body.muscleGroup === "string") {
    const single = body.muscleGroup.trim() || null;
    updates.muscleGroup = single;
    updates.muscleGroups = single ? [single] : [];
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Le filtre sur userId fait tout le travail : renommer n'agit que sur SA
  // copie, et un exercice d'un autre utilisateur ressort en 404.
  const [updated] = await db
    .update(exercises)
    .set(updates)
    .where(
      and(eq(exercises.id, parseInt(id)), eq(exercises.userId, auth.userId)),
    )
    .returning();

  if (!updated) {
    return Response.json({ error: "Exercise not found" }, { status: 404 });
  }

  const ug = resolveMuscleGroups(updated.muscleGroups, updated.muscleGroup);
  return Response.json({
    id: updated.id,
    name: updated.name,
    hasVariants: updated.hasVariants,
    muscleGroup: ug[0] ?? null,
    muscleGroups: ug,
  });
}
