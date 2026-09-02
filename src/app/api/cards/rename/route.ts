import { db } from "@/lib/db";
import { userCardNames } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { unlockedTalents } from "@/lib/talents-server";
import { ownsCard, type MascotCategory } from "@/lib/mascots";

// Le Vœu (Jirachi) : renommer une carte possédée. Surnom purement
// cosmétique, visible uniquement par son propriétaire.
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const talents = await unlockedTalents(auth.userId);
  if (!talents.some((t) => t.id === "voeu")) {
    return Response.json({ error: "Talent requis" }, { status: 403 });
  }

  const body = await request.json();
  const category = body.category as MascotCategory;
  const cardId = body.cardId as number;
  const nickname = typeof body.nickname === "string" ? body.nickname.trim().slice(0, 40) : "";

  if ((category !== "animal" && category !== "pokemon") || !Number.isInteger(cardId)) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (!(await ownsCard(auth.userId, category, cardId))) {
    return Response.json({ error: "Carte non possédée" }, { status: 403 });
  }

  if (!nickname) {
    await db
      .delete(userCardNames)
      .where(
        and(
          eq(userCardNames.userId, auth.userId),
          eq(userCardNames.category, category),
          eq(userCardNames.cardId, cardId),
        ),
      );
    return Response.json({ nickname: null });
  }

  await db
    .insert(userCardNames)
    .values({ userId: auth.userId, category, cardId, nickname })
    .onConflictDoUpdate({
      target: [userCardNames.userId, userCardNames.category, userCardNames.cardId],
      set: { nickname },
    });
  return Response.json({ nickname });
}
