import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { resolveMuscleGroups } from "@/lib/muscle-groups";
import { loadMascotsByExercise, ownsCard, type MascotCategory } from "@/lib/mascots";
import { guardianBondStatus } from "@/lib/guardians";

// `mascot` vaut soit null (retirer la décoration), soit { category, id }.
// Toute autre forme est ignorée pour ne pas écraser la mascotte existante
// sur un PATCH qui ne parle que du nom ou des muscles.
function parseMascot(
  input: unknown,
): { category: MascotCategory; id: number } | null | undefined {
  if (input === undefined) return undefined;
  if (input === null) return null;
  if (typeof input !== "object") return undefined;
  const raw = input as { category?: unknown; id?: unknown };
  if (raw.category !== "animal" && raw.category !== "pokemon") return undefined;
  if (typeof raw.id !== "number" || !Number.isInteger(raw.id)) return undefined;
  return { category: raw.category, id: raw.id };
}

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

  const updates: Record<string, string | string[] | boolean | number | Date | null> = {};
  if (body.name?.trim()) updates.name = body.name.trim();
  if (typeof body.hasVariants === "boolean") updates.hasVariants = body.hasVariants;

  // La polarité du gardien : attirer ou repousser, changeable à volonté.
  if (body.mascotMode === "attract" || body.mascotMode === "repel") {
    updates.mascotMode = body.mascotMode;
  }

  const mascot = parseMascot(body.mascot);
  if (mascot !== undefined) {
    // Le Gardien lié : on ne retire ni ne remplace un gardien posé sans
    // avoir battu son record sur la machine, ou attendu 30 jours.
    const exerciseId = parseInt(id);
    const [current] = await db
      .select({
        a: exercises.mascotAnimalId,
        p: exercises.mascotPokemonId,
      })
      .from(exercises)
      .where(and(eq(exercises.id, exerciseId), eq(exercises.userId, auth.userId)));
    const currentId = current?.a ?? current?.p ?? null;
    const currentCat = current?.a ? "animal" : current?.p ? "pokemon" : null;
    const isSameCard =
      mascot !== null && currentCat === mascot.category && currentId === mascot.id;
    const isChange = currentId !== null && !isSameCard;
    if (isChange) {
      const bond = await guardianBondStatus(exerciseId, auth.userId);
      if (bond.locked) {
        return Response.json(
          {
            error: "Gardien lié — bats ton record sur cette machine ou attends la fin du lien",
            unlockAt: bond.unlockAt,
          },
          { status: 403 },
        );
      }
    }

    if (mascot === null) {
      updates.mascotAnimalId = null;
      updates.mascotPokemonId = null;
      updates.mascotTriggers = 0;
      updates.mascotAssignedAt = null;
    } else if (!isSameCard) {
      if (!(await ownsCard(auth.userId, mascot.category, mascot.id))) {
        return Response.json({ error: "Carte non possédée" }, { status: 403 });
      }
      // Les deux colonnes sont exclusives : on remet l'autre à null. Changer
      // de carte remet la Fidélité à zéro et noue un nouveau lien.
      updates.mascotAnimalId = mascot.category === "animal" ? mascot.id : null;
      updates.mascotPokemonId = mascot.category === "pokemon" ? mascot.id : null;
      updates.mascotTriggers = 0;
      updates.mascotAssignedAt = new Date();
    }
  }

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
  const mascots = await loadMascotsByExercise([updated.id]);
  const bond = await guardianBondStatus(updated.id, auth.userId);
  return Response.json({
    id: updated.id,
    name: updated.name,
    hasVariants: updated.hasVariants,
    muscleGroup: ug[0] ?? null,
    muscleGroups: ug,
    mascot: mascots.get(updated.id) ?? null,
    mascotMode: updated.mascotMode ?? "attract",
    mascotBond: bond,
  });
}
