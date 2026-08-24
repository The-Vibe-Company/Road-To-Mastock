import { db } from "@/lib/db";
import { sessions, sessionExercises, sets } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// Les ids de séance, d'exercice de séance et de série sont séquentiels : sans
// contrôle de propriétaire, connaître un id suffit pour lire ou modifier les
// données de quelqu'un d'autre. Ces helpers ramènent la séance concernée
// uniquement si elle appartient bien à l'utilisateur.

export async function ownsSession(sessionId: number, userId: number) {
  const [row] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
  return !!row;
}

export async function ownsSessionExercise(
  sessionExerciseId: number,
  userId: number,
) {
  const [row] = await db
    .select({ id: sessionExercises.id })
    .from(sessionExercises)
    .innerJoin(sessions, eq(sessions.id, sessionExercises.sessionId))
    .where(
      and(
        eq(sessionExercises.id, sessionExerciseId),
        eq(sessions.userId, userId),
      ),
    );
  return !!row;
}

export async function ownsSet(setId: number, userId: number) {
  const [row] = await db
    .select({ id: sets.id })
    .from(sets)
    .innerJoin(
      sessionExercises,
      eq(sessionExercises.id, sets.sessionExerciseId),
    )
    .innerJoin(sessions, eq(sessions.id, sessionExercises.sessionId))
    .where(and(eq(sets.id, setId), eq(sessions.userId, userId)));
  return !!row;
}

// Une Response ne peut être consommée qu'une fois : on en construit une neuve
// à chaque appel plutôt que de partager une constante entre les requêtes.
export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFound() {
  return Response.json({ error: "Not found" }, { status: 404 });
}
