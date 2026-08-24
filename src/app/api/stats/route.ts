import { getAuthUser } from "@/lib/auth";
import { getUserStats } from "@/lib/stats";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await getUserStats(auth.userId);

  // Pas de max-age : les seances se creent via des route handlers, et un cache
  // navigateur de 60s reservait des stats perimees juste apres une creation.
  return Response.json(stats, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
