import { db } from "@/lib/db";
import { sets } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export async function POST(request: Request) {
  const body = await request.json();

  // Auto-increment set number
  const [{ value: currentCount }] = await db
    .select({ value: count() })
    .from(sets)
    .where(eq(sets.sessionExerciseId, body.sessionExerciseId));

  const [result] = await db
    .insert(sets)
    .values({
      sessionExerciseId: body.sessionExerciseId,
      setNumber: currentCount + 1,
      weightKg: body.weightKg,
      reps: body.reps,
    })
    .returning();

  return Response.json(result, { status: 201 });
}
