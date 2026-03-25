import { db } from "@/lib/db";
import { sessions, sessionExercises, sets } from "@/lib/db/schema";
import { desc, eq, count, sql } from "drizzle-orm";

export async function GET() {
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
    .groupBy(sessions.id)
    .orderBy(desc(sessions.date), desc(sessions.createdAt));

  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [session] = await db
    .insert(sessions)
    .values({
      date: body.date || new Date().toISOString().split("T")[0],
      notes: body.notes || null,
    })
    .returning();

  return Response.json(session, { status: 201 });
}
