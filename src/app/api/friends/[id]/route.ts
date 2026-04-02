import { db } from "@/lib/db";
import { friendships } from "@/lib/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const friendshipId = parseInt(id);
  const { action } = await request.json();

  if (action !== "accept" && action !== "decline") {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  // Only addressee can accept/decline
  const [friendship] = await db
    .select()
    .from(friendships)
    .where(and(eq(friendships.id, friendshipId), eq(friendships.addresseeId, auth.userId)));

  if (!friendship) return Response.json({ error: "Not found" }, { status: 404 });

  if (action === "decline") {
    await db.delete(friendships).where(eq(friendships.id, friendshipId));
    return Response.json({ ok: true });
  }

  const [updated] = await db
    .update(friendships)
    .set({ status: "accepted" })
    .where(eq(friendships.id, friendshipId))
    .returning();

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const friendshipId = parseInt(id);

  // Either party can remove
  await db.execute(sql`
    DELETE FROM friendships
    WHERE id = ${friendshipId}
      AND (requester_id = ${auth.userId} OR addressee_id = ${auth.userId})
  `);

  return Response.json({ ok: true });
}
