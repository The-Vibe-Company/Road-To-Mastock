import { db } from "@/lib/db";
import { friendships, users } from "@/lib/db/schema";
import { eq, or, and, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rows = (await db.execute(sql`
    SELECT f.id, f.status, f.requester_id, f.addressee_id,
           u.id AS user_id, u.name, u.email
    FROM friendships f
    JOIN users u ON u.id = CASE
      WHEN f.requester_id = ${auth.userId} THEN f.addressee_id
      ELSE f.requester_id
    END
    WHERE (f.requester_id = ${auth.userId} OR f.addressee_id = ${auth.userId})
      AND f.status IN ('pending', 'accepted')
  `)) as unknown as { rows?: any[] };

  const data = (rows.rows ?? rows) as unknown as {
    id: number;
    status: string;
    requester_id: number;
    addressee_id: number;
    user_id: number;
    name: string;
    email: string;
  }[];

  const friends = data
    .filter((r) => r.status === "accepted")
    .map((r) => ({ friendshipId: r.id, userId: r.user_id, name: r.name, email: r.email }));

  const pendingReceived = data
    .filter((r) => r.status === "pending" && r.addressee_id === auth.userId)
    .map((r) => ({ friendshipId: r.id, userId: r.user_id, name: r.name, email: r.email }));

  const pendingSent = data
    .filter((r) => r.status === "pending" && r.requester_id === auth.userId)
    .map((r) => ({ friendshipId: r.id, userId: r.user_id, name: r.name, email: r.email }));

  return Response.json({ friends, pendingReceived, pendingSent });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await request.json();
  if (!email) return Response.json({ error: "Email required" }, { status: 400 });

  // Find target user
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  if (!target) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 });
  if (target.id === auth.userId) return Response.json({ error: "Tu ne peux pas t'ajouter toi-meme" }, { status: 400 });

  // Check existing friendship (in either direction)
  const existing = (await db.execute(sql`
    SELECT id, status FROM friendships
    WHERE (requester_id = ${auth.userId} AND addressee_id = ${target.id})
       OR (requester_id = ${target.id} AND addressee_id = ${auth.userId})
    LIMIT 1
  `)) as unknown as { rows?: any[] };

  const existingRows = (existing.rows ?? existing) as unknown as { id: number; status: string }[];
  if (existingRows.length > 0) {
    const f = existingRows[0];
    if (f.status === "accepted") return Response.json({ error: "Deja amis" }, { status: 400 });
    if (f.status === "pending") return Response.json({ error: "Demande deja envoyee" }, { status: 400 });
  }

  const [created] = await db
    .insert(friendships)
    .values({ requesterId: auth.userId, addresseeId: target.id })
    .returning();

  return Response.json(created, { status: 201 });
}
