import { db } from "@/lib/db";
import { exercises, sessionExercises, sessions } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      useCount: count(sessionExercises.id),
    })
    .from(sessionExercises)
    .innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(eq(sessions.userId, auth.userId))
    .groupBy(exercises.id)
    .orderBy(desc(count(sessionExercises.id)))
    .limit(10);

  return Response.json(result);
}
