import { db } from "@/lib/db";
import { exercises, exerciseWeights } from "@/lib/db/schema";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

// Paliers de poids d'une machine, propres a l'utilisateur (ils pendent d'un
// exercice possede). Alimentes automatiquement a chaque serie enregistree,
// et corrigeables a la main ici.
//
// Les plaques changent d'une salle a l'autre : quand l'exercice a des
// versions, les paliers sont ranges par version. `variantId` absent = les
// paliers de l'exercice sans version.

function variantFilter(exerciseId: number, variantId: number | null) {
  return variantId === null
    ? and(
        eq(exerciseWeights.exerciseId, exerciseId),
        isNull(exerciseWeights.variantId),
      )
    : and(
        eq(exerciseWeights.exerciseId, exerciseId),
        eq(exerciseWeights.variantId, variantId),
      );
}

function readVariantId(request: Request): number | null {
  const raw = new URL(request.url).searchParams.get("variantId");
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
}

async function ownedExercise(exerciseId: number, userId: number) {
  const [row] = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)));
  return row ?? null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const exerciseId = parseInt((await params).id);
  if (!(await ownedExercise(exerciseId, auth.userId))) {
    return Response.json({ error: "Exercise not found" }, { status: 404 });
  }

  const rows = await db
    .select({ weightKg: exerciseWeights.weightKg })
    .from(exerciseWeights)
    .where(variantFilter(exerciseId, readVariantId(request)))
    .orderBy(asc(exerciseWeights.weightKg));

  return Response.json(rows.map((r) => r.weightKg));
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
  const weight = Number(body.weightKg);
  if (!Number.isFinite(weight) || weight <= 0) {
    return Response.json({ error: "Poids invalide" }, { status: 400 });
  }

  const variantId =
    typeof body.variantId === "number" ? body.variantId : null;

  await db
    .insert(exerciseWeights)
    .values({ exerciseId, variantId, weightKg: weight })
    .onConflictDoNothing();

  return Response.json({ weightKg: weight }, { status: 201 });
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

  const weight = Number(new URL(request.url).searchParams.get("weightKg"));
  if (!Number.isFinite(weight)) {
    return Response.json({ error: "Poids invalide" }, { status: 400 });
  }

  await db
    .delete(exerciseWeights)
    .where(
      and(
        variantFilter(exerciseId, readVariantId(request)),
        eq(exerciseWeights.weightKg, weight),
      ),
    );

  return Response.json({ ok: true });
}
