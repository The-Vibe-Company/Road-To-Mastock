import { db } from "@/lib/db";
import { exercises, sessionExercises, sessions } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { resolveMuscleGroups } from "@/lib/muscle-groups";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      kind: exercises.kind,
      muscleGroup: exercises.muscleGroup,
      muscleGroups: exercises.muscleGroups,
      useCount: count(sessionExercises.id),
    })
    .from(sessionExercises)
    .innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(eq(sessions.userId, auth.userId))
    .groupBy(exercises.id)
    .orderBy(desc(count(sessionExercises.id)))
    .limit(10);

  return Response.json(
    result.map((r) => {
      const groups = resolveMuscleGroups(r.muscleGroups, r.muscleGroup);
      return {
        id: r.id,
        name: r.name,
        kind: r.kind ?? "muscu",
        muscleGroup: groups[0] ?? null,
        muscleGroups: groups,
        useCount: r.useCount,
      };
    }),
  );
}
