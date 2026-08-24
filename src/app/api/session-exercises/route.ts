import { db } from "@/lib/db";
import { sessionExercises } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { notFound, ownsSession, unauthorized } from "@/lib/ownership";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return unauthorized();

  const body = await request.json();

  if (!(await ownsSession(Number(body.sessionId), auth.userId))) {
    return notFound();
  }

  // Get current count for sort order
  const [{ value: currentCount }] = await db
    .select({ value: count() })
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, body.sessionId));

  const [result] = await db
    .insert(sessionExercises)
    .values({
      sessionId: body.sessionId,
      exerciseId: body.exerciseId,
      // Version (la salle) utilisee ce jour-la ; null si l'exercice n'en a pas.
      variantId: typeof body.variantId === "number" ? body.variantId : null,
      sortOrder: currentCount,
    })
    .returning();

  revalidatePath("/");
  return Response.json(result, { status: 201 });
}
