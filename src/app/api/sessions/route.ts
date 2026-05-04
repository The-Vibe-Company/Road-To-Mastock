import { db } from "@/lib/db";
import { sessions, sessionExercises } from "@/lib/db/schema";
import { desc, eq, count, and, isNotNull } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select({
      id: sessions.id,
      date: sessions.date,
      notes: sessions.notes,
      createdAt: sessions.createdAt,
      exerciseCount: count(sessionExercises.id),
    })
    .from(sessions)
    .leftJoin(sessionExercises, eq(sessions.id, sessionExercises.sessionId))
    .where(eq(sessions.userId, auth.userId))
    .groupBy(sessions.id)
    .orderBy(desc(sessions.date), desc(sessions.createdAt));

  return Response.json(result);
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Prefill bodyweight from the user's most recent session that has one,
  // so creating a new session inherits the last known weight.
  let bodyweightKg: number | null = typeof body.bodyweightKg === "number" ? body.bodyweightKg : null;
  if (bodyweightKg == null) {
    const [last] = await db
      .select({ bodyweightKg: sessions.bodyweightKg })
      .from(sessions)
      .where(and(eq(sessions.userId, auth.userId), isNotNull(sessions.bodyweightKg)))
      .orderBy(desc(sessions.date), desc(sessions.createdAt))
      .limit(1);
    bodyweightKg = last?.bodyweightKg ?? null;
  }

  const [session] = await db
    .insert(sessions)
    .values({
      userId: auth.userId,
      date: body.date || new Date().toISOString().split("T")[0],
      notes: body.notes || null,
      bodyweightKg,
    })
    .returning();

  revalidatePath("/");
  return Response.json(session, { status: 201 });
}
