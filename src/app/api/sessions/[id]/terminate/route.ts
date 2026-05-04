import { db } from "@/lib/db";
import {
  sessions,
  sessionExercises,
  sets,
  users,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
  let specialTokenGranted = false;
  // 1ʳᵉ et 4ᵉ séance terminée de la semaine ISO (basée sur sessions.date,
  // pas la date de termination) → jeton spécial à la place du jeton normal.
  // Sessions 2/3/5+ de la semaine → jeton normal classique.
  let weekPosition: number | null = null;

  if (!session.tokensGrantedAt) {
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
      // Compte les AUTRES sessions ayant déjà reçu un jeton et dont la
      // DATE de séance (pas la date de termination) tombe dans la même
      // semaine ISO que la session courante. Ainsi, terminer en batch
      // 5 sessions de 5 semaines distinctes donne 5 specials, pas 1.
      const countRes = (await db.execute(sql`
        SELECT COUNT(*)::int AS "countBefore"
        FROM sessions
        WHERE user_id = ${auth.userId}
          AND tokens_granted_at IS NOT NULL
          AND id != ${sessionId}
          AND DATE_TRUNC('week', date::timestamp) = DATE_TRUNC('week', ${session.date}::timestamp)
      `)) as unknown as { rows?: { countBefore: number }[] };
      const rows = (countRes.rows ?? countRes) as unknown as { countBefore: number }[];
      const previousThisWeek = Number(rows[0]?.countBefore ?? 0);
      weekPosition = previousThisWeek + 1;

      const isSpecialPosition = weekPosition === 1 || weekPosition === 4;
      if (isSpecialPosition) {
        await db
          .update(users)
          .set({ cardsSpecialTokens: sql`${users.cardsSpecialTokens} + 1` })
          .where(eq(users.id, auth.userId));
        specialTokenGranted = true;
      } else {
        await db
          .update(users)
          .set({ cardsTokens: sql`${users.cardsTokens} + 1` })
          .where(eq(users.id, auth.userId));
        tokenGranted = true;
      }
    } else {
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
    .select({ tokens: users.cardsTokens, specialTokens: users.cardsSpecialTokens })
    .from(users)
    .where(eq(users.id, auth.userId));

  revalidatePath("/");
  return Response.json({
    terminated: true,
    tokenGranted,
    specialTokenGranted,
    weekPosition,
    tokens: user?.tokens ?? 0,
    specialTokens: user?.specialTokens ?? 0,
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
  revalidatePath("/");
  return Response.json({ terminated: false });
}
