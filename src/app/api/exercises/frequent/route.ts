import { db } from "@/lib/db";
import { exercises, sessionExercises, sessions, sets } from "@/lib/db/schema";
import { eq, desc, asc, count, countDistinct, max } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { resolveMuscleGroups } from "@/lib/muscle-groups";

// Classement des exercices deja faits, du plus frequent au moins frequent.
// `?limit=all` renvoie tout le classement (onglet Exercices de la home),
// sinon on garde le top 10 (raccourci du selecteur d'exercice).
export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const limitParam = new URL(request.url).searchParams.get("limit");
  const limit = limitParam === "all" ? null : Number(limitParam) || 10;

  const query = db
    .select({
      id: exercises.id,
      name: exercises.name,
      kind: exercises.kind,
      isAssisted: exercises.isAssisted,
      muscleGroup: exercises.muscleGroup,
      muscleGroups: exercises.muscleGroups,
      hasVariants: exercises.hasVariants,
      useCount: countDistinct(sessionExercises.id),
      setCount: count(sets.id),
      lastDate: max(sessions.date),
    })
    .from(sessionExercises)
    .innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .leftJoin(sets, eq(sets.sessionExerciseId, sessionExercises.id))
    .where(eq(sessions.userId, auth.userId))
    .groupBy(exercises.id)
    .orderBy(
      desc(countDistinct(sessionExercises.id)),
      desc(count(sets.id)),
      asc(exercises.name),
    );

  const result = limit === null ? await query : await query.limit(limit);

  return Response.json(
    result.map((r) => {
      const groups = resolveMuscleGroups(r.muscleGroups, r.muscleGroup);
      return {
        id: r.id,
        name: r.name,
        kind: r.kind ?? "muscu",
        isAssisted: r.isAssisted ?? false,
        hasVariants: r.hasVariants ?? false,
        muscleGroup: groups[0] ?? null,
        muscleGroups: groups,
        useCount: r.useCount,
        setCount: r.setCount,
        lastDate: r.lastDate,
      };
    }),
  );
}
