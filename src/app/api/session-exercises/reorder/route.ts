import { db } from "@/lib/db";
import { sessionExercises } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function PUT(request: Request) {
  const { ids } = await request.json() as { ids: number[] };

  // Update each exercise's sortOrder to its index in the array
  await Promise.all(
    ids.map((id, index) =>
      db.execute(
        sql`UPDATE session_exercises SET sort_order = ${index} WHERE id = ${id}`
      )
    )
  );

  return Response.json({ ok: true });
}
