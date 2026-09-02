import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { resolveCardioDraft } from "@/lib/guardians";
import type { MascotMode } from "@/lib/powers";

// L'Échappée, acte 2 : le joueur place les cartes tirées par son cardio.
// Chaque tirage ne se résout qu'une fois (claim en base), l'éveil part
// dans le chapeau avec la polarité choisie.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = parseInt((await params).id);
  const [session] = await db
    .select({ id: sessions.id, tokensGrantedAt: sessions.tokensGrantedAt })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, auth.userId)));
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (!session.tokensGrantedAt) {
    return Response.json({ error: "Clôture d'abord la séance" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const rawChoices = Array.isArray(body?.choices) ? body.choices : [];
  const choices = rawChoices
    .filter(
      (c: { drawId?: unknown; mode?: unknown }) =>
        Number.isInteger(c?.drawId) && (c?.mode === "attract" || c?.mode === "repel"),
    )
    .map((c: { drawId: number; mode: MascotMode }) => ({ drawId: c.drawId, mode: c.mode }));
  if (choices.length === 0) {
    return Response.json({ error: "Aucun placement valide" }, { status: 400 });
  }

  const result = await resolveCardioDraft(auth.userId, sessionId, choices);
  return Response.json(result);
}
