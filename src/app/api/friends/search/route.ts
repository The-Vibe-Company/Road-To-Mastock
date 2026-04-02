import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return Response.json([]);

  const results = (await db.execute(sql`
    SELECT id, name, email
    FROM users
    WHERE id != ${auth.userId}
      AND (name ILIKE ${"%" + q + "%"} OR email ILIKE ${"%" + q + "%"})
    LIMIT 10
  `)) as unknown as { rows?: any[] };

  const rows = (results.rows ?? results) as unknown as { id: number; name: string; email: string }[];

  return Response.json(rows);
}
