import { db } from "@/lib/db";
import { sessionExercises } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export async function POST(request: Request) {
  const body = await request.json();

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
      sortOrder: currentCount,
    })
    .returning();

  return Response.json(result, { status: 201 });
}
