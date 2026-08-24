import { db } from "@/lib/db";
import { exercises, exerciseVariants } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

// Versions d'un exercice — en pratique la salle. Toujours filtrees par
// proprietaire via l'exercice parent.

async function ownedExercise(exerciseId: number, userId: number) {
  const [row] = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)));
  return row ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const exerciseId = parseInt((await params).id);
  if (!(await ownedExercise(exerciseId, auth.userId))) {
    return Response.json({ error: "Exercise not found" }, { status: 404 });
  }

  const rows = await db
    .select({ id: exerciseVariants.id, name: exerciseVariants.name })
    .from(exerciseVariants)
    .where(eq(exerciseVariants.exerciseId, exerciseId))
    .orderBy(asc(exerciseVariants.name));

  return Response.json(rows);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const exerciseId = parseInt((await params).id);
  if (!(await ownedExercise(exerciseId, auth.userId))) {
    return Response.json({ error: "Exercise not found" }, { status: 404 });
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return Response.json({ error: "Nom requis" }, { status: 400 });

  const [created] = await db
    .insert(exerciseVariants)
    .values({ exerciseId, name })
    .onConflictDoNothing()
    .returning({ id: exerciseVariants.id, name: exerciseVariants.name });

  if (created) return Response.json(created, { status: 201 });

  const [existing] = await db
    .select({ id: exerciseVariants.id, name: exerciseVariants.name })
    .from(exerciseVariants)
    .where(
      and(
        eq(exerciseVariants.exerciseId, exerciseId),
        eq(exerciseVariants.name, name),
      ),
    );
  return Response.json(existing);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const exerciseId = parseInt((await params).id);
  if (!(await ownedExercise(exerciseId, auth.userId))) {
    return Response.json({ error: "Exercise not found" }, { status: 404 });
  }

  const body = await request.json();
  const variantId = Number(body.variantId);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!Number.isInteger(variantId) || !name) {
    return Response.json({ error: "Version ou nom invalide" }, { status: 400 });
  }

  // Renommer la salle la renomme partout ou elle est utilisee : les seances
  // passees pointent sur la version, pas sur son libelle.
  const [updated] = await db
    .update(exerciseVariants)
    .set({ name })
    .where(
      and(
        eq(exerciseVariants.id, variantId),
        eq(exerciseVariants.exerciseId, exerciseId),
      ),
    )
    .returning({ id: exerciseVariants.id, name: exerciseVariants.name });

  if (!updated) {
    return Response.json({ error: "Version introuvable" }, { status: 404 });
  }
  return Response.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const exerciseId = parseInt((await params).id);
  if (!(await ownedExercise(exerciseId, auth.userId))) {
    return Response.json({ error: "Exercise not found" }, { status: 404 });
  }

  const variantId = Number(new URL(request.url).searchParams.get("variantId"));
  if (!Number.isInteger(variantId)) {
    return Response.json({ error: "Version invalide" }, { status: 400 });
  }

  // Les séances gardent leur historique : `session_exercises.variant_id`
  // repasse à null (on delete set null), les paliers de la version partent.
  await db
    .delete(exerciseVariants)
    .where(
      and(
        eq(exerciseVariants.id, variantId),
        eq(exerciseVariants.exerciseId, exerciseId),
      ),
    );

  return Response.json({ ok: true });
}
