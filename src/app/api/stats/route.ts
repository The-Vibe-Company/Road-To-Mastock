import { getAuthUser } from "@/lib/auth";
import { getUserStats } from "@/lib/stats";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await getUserStats(auth.userId);

  return Response.json(stats, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
