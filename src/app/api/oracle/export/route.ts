import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { unlockedTalents } from "@/lib/talents-server";

// Les Racines (Niðhöggr) : l'export intégral des données d'entraînement.
export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const talents = await unlockedTalents(auth.userId);
  if (!talents.some((t) => t.id === "racines")) {
    return Response.json({ error: "Talent requis" }, { status: 403 });
  }

  const res = (await db.execute(sql`
    SELECT s.date, s.bodyweight_kg, e.name AS exercise, ev.name AS variant,
           st.set_number, st.weight_kg, st.reps, st.duration_minutes,
           st.calories, st.distance_km, st.assistance_kg
    FROM sessions s
    JOIN session_exercises se ON se.session_id = s.id
    JOIN exercises e ON e.id = se.exercise_id
    LEFT JOIN exercise_variants ev ON ev.id = se.variant_id
    LEFT JOIN sets st ON st.session_exercise_id = se.id
    WHERE s.user_id = ${auth.userId}
    ORDER BY s.date, se.sort_order, st.set_number
  `)) as unknown as { rows?: unknown[] };

  return new Response(JSON.stringify(res.rows ?? res, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="road-to-mastock-export.json"`,
    },
  });
}
