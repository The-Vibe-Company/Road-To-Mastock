import { db } from "@/lib/db";
import {
  sessions,
  sessionExercises,
  sets,
  users,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

async function sessionHasSets(sessionId: number) {
  const [row] = await db
    .select({ c: sql<number>`COUNT(${sets.id})::int` })
    .from(sets)
    .innerJoin(sessionExercises, eq(sets.sessionExerciseId, sessionExercises.id))
    .where(eq(sessionExercises.sessionId, sessionId));
  return (row?.c ?? 0) > 0;
}

// POST: mark session as terminated. Grants 1 token if not already granted
// for this session (idempotent across re-terminate cycles).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sessionId = parseInt(id);

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, auth.userId)));
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });

  if (!(await sessionHasSets(sessionId))) {
    return Response.json(
      { error: "Termine au moins une série avant de clôturer" },
      { status: 400 },
    );
  }

  let tokenGranted = false;
  if (!session.tokensGrantedAt) {
    // Atomic update: only grant if tokens_granted_at is still NULL
    const [updated] = await db
      .update(sessions)
      .set({
        terminatedAt: new Date(),
        tokensGrantedAt: new Date(),
      })
      .where(
        and(
          eq(sessions.id, sessionId),
          eq(sessions.userId, auth.userId),
          sql`${sessions.tokensGrantedAt} IS NULL`,
        ),
      )
      .returning();
    if (updated) {
      tokenGranted = true;
      await db
        .update(users)
        .set({ cardsTokens: sql`${users.cardsTokens} + 1` })
        .where(eq(users.id, auth.userId));
    } else {
      // Concurrent grant happened; just ensure terminatedAt is set
      await db
        .update(sessions)
        .set({ terminatedAt: new Date() })
        .where(and(eq(sessions.id, sessionId), eq(sessions.userId, auth.userId)));
    }
  } else {
    await db
      .update(sessions)
      .set({ terminatedAt: new Date() })
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, auth.userId)));
  }

  const [user] = await db
    .select({ tokens: users.cardsTokens })
    .from(users)
    .where(eq(users.id, auth.userId));

  return Response.json({
    terminated: true,
    tokenGranted,
    tokens: user?.tokens ?? 0,
  });
}

// DELETE: undo termination (does NOT take back the token).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sessionId = parseInt(id);

  const [updated] = await db
    .update(sessions)
    .set({ terminatedAt: null })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, auth.userId)))
    .returning();

  if (!updated) return Response.json({ error: "Session not found" }, { status: 404 });
  return Response.json({ terminated: false });
}
