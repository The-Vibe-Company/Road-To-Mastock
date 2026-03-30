import { db } from "@/lib/db";
import { exercises, sessions, sessionExercises, sets } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const exerciseId = parseInt(id);

  const [exercise] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, exerciseId));

  if (!exercise) {
    return Response.json({ error: "Exercise not found" }, { status: 404 });
  }

  const rows = await db
    .select({
      date: sessions.date,
      sessionId: sessions.id,
      setNumber: sets.setNumber,
      weightKg: sets.weightKg,
      reps: sets.reps,
    })
    .from(sessionExercises)
    .innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
    .innerJoin(sets, eq(sets.sessionExerciseId, sessionExercises.id))
    .where(
      and(
        eq(sessionExercises.exerciseId, exerciseId),
        eq(sessions.userId, auth.userId)
      )
    )
    .orderBy(asc(sessions.date), asc(sets.setNumber));

  const bySession: Record<
    string,
    {
      date: string;
      sessionId: number;
      sets: { setNumber: number; weightKg: number; reps: number }[];
    }
  > = {};

  for (const row of rows) {
    const key = `${row.sessionId}`;
    if (!bySession[key]) {
      bySession[key] = {
        date: row.date,
        sessionId: row.sessionId,
        sets: [],
      };
    }
    bySession[key].sets.push({
      setNumber: row.setNumber,
      weightKg: row.weightKg,
      reps: row.reps,
    });
  }

  const history = Object.values(bySession);

  return Response.json({ exercise, history });
}
