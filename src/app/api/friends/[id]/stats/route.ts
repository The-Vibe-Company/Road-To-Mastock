import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { getUserStats } from "@/lib/stats";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const friendUserId = parseInt(id);

  // Verify accepted friendship exists
  const result = (await db.execute(sql`
    SELECT id FROM friendships
    WHERE status = 'accepted'
      AND (
        (requester_id = ${auth.userId} AND addressee_id = ${friendUserId})
        OR (requester_id = ${friendUserId} AND addressee_id = ${auth.userId})
      )
    LIMIT 1
  `)) as unknown as { rows?: any[] };

  const rows = (result.rows ?? result) as unknown as { id: number }[];
  if (rows.length === 0) {
    return Response.json({ error: "Not friends" }, { status: 403 });
  }

  const stats = await getUserStats(friendUserId);

  return Response.json(stats, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
