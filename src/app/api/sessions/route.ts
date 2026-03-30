import { db } from "@/lib/db";
import { sessions, sessionExercises } from "@/lib/db/schema";
import { desc, eq, count, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

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
  const [session] = await db
    .insert(sessions)
    .values({
      userId: auth.userId,
      date: body.date || new Date().toISOString().split("T")[0],
      notes: body.notes || null,
    })
    .returning();

  return Response.json(session, { status: 201 });
}
