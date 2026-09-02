import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { unlockedTalents } from "@/lib/talents-server";
import { loadMascotsByExercise } from "@/lib/mascots";

// Le Lien (Manaphy) : voir le plateau de Gardiens d'un ami. Gated par le
// talent du VISITEUR — c'est son privilège, pas celui de l'ami.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const talents = await unlockedTalents(auth.userId);
  if (!talents.some((t) => t.id === "lien")) {
    return Response.json({ error: "Talent requis" }, { status: 403 });
  }

  const { id } = await params;
  const friendUserId = parseInt(id);

  const friendship = (await db.execute(sql`
    SELECT id FROM friendships
    WHERE status = 'accepted'
      AND ((requester_id = ${auth.userId} AND addressee_id = ${friendUserId})
        OR (requester_id = ${friendUserId} AND addressee_id = ${auth.userId}))
    LIMIT 1
  `)) as unknown as { rows?: unknown[] };
  if (((friendship.rows ?? friendship) as unknown[]).length === 0) {
    return Response.json({ error: "Not friends" }, { status: 403 });
  }

  const rows = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .where(eq(exercises.userId, friendUserId));
  const mascots = await loadMascotsByExercise(rows.map((r) => r.id));

  return Response.json(
    rows
      .filter((r) => mascots.has(r.id))
      .map((r) => ({ exerciseName: r.name, mascot: mascots.get(r.id) })),
  );
}
