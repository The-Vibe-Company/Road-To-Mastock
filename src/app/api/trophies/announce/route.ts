import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { earnedTrophies } from "@/lib/trophies-server";

// Marque tous les trophées gagnés comme annoncés — la célébration de
// reconnexion ne se répète pas.
export async function POST() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const earned = await earnedTrophies(auth.userId);
  const [u] = await db
    .select({ announced: users.announcedTrophies })
    .from(users)
    .where(eq(users.id, auth.userId));
  const merged = new Set((u?.announced ?? "").split(",").filter(Boolean));
  for (const id of earned) merged.add(id);
  await db
    .update(users)
    .set({ announcedTrophies: [...merged].join(",") })
    .where(eq(users.id, auth.userId));
  return Response.json({ announced: [...merged] });
}
