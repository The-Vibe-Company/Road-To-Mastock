import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { unlockedTalents } from "@/lib/talents-server";

// Marque les talents du joueur comme annoncés : la présentation de
// reconnexion ne se répète pas, même en changeant d'appareil.
export async function POST() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const discovered = await unlockedTalents(auth.userId);
  const [user] = await db
    .select({ announced: users.announcedTalents })
    .from(users)
    .where(eq(users.id, auth.userId));
  const merged = new Set((user?.announced ?? "").split(",").filter(Boolean));
  for (const t of discovered) merged.add(t.id);

  await db
    .update(users)
    .set({ announcedTalents: [...merged].join(",") })
    .where(eq(users.id, auth.userId));
  return Response.json({ announced: [...merged] });
}
