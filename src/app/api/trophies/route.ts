import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { computeTrophyStats } from "@/lib/trophies-server";
import { TROPHIES, earnedTrophyIds } from "@/lib/trophies";

// Le cabinet complet : chaque trophée avec sa progression réelle, et la
// liste des gagnés jamais annoncés (célébrés à la reconnexion).
export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await computeTrophyStats(auth.userId);
  const earned = new Set(earnedTrophyIds(stats));

  const [u] = await db
    .select({ announced: users.announcedTrophies })
    .from(users)
    .where(eq(users.id, auth.userId));
  const announced = new Set((u?.announced ?? "").split(",").filter(Boolean));
  const unannounced = [...earned].filter((id) => !announced.has(id));

  return Response.json({
    unannounced,
    stats,
    trophies: TROPHIES.map((t) => {
      const isEarned = earned.has(t.id);
      // Le titre reste un secret jusqu'à la victoire : avant, on sait
      // seulement qu'un titre attend. Les récompenses fonctionnelles
      // (couleurs, Étendard...) restent annoncées — ce sont des objectifs.
      const rewardLabel =
        t.reward.type === "title" && !isEarned
          ? "Un titre t'attend — secret jusqu'à la victoire"
          : t.rewardLabel;
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        rewardLabel,
        rewardType: t.reward.type,
        target: t.target,
        progress: Math.min(stats[t.stat], t.target),
        earned: isEarned,
      };
    }),
  });
}
