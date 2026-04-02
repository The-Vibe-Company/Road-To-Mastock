import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { ACCENT_PRESETS } from "@/lib/colors";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db
    .select({ accentColor: users.accentColor, theme: users.theme })
    .from(users)
    .where(eq(users.id, auth.userId));

  return Response.json({
    accentColor: user?.accentColor || "orange",
    theme: user?.theme || "dark",
  });
}

export async function PATCH(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const update: Partial<{ accentColor: string; theme: string }> = {};

  if (body.accentColor) {
    if (!ACCENT_PRESETS[body.accentColor]) {
      return Response.json({ error: "Invalid color" }, { status: 400 });
    }
    update.accentColor = body.accentColor;
  }

  if (body.theme) {
    if (body.theme !== "dark" && body.theme !== "light") {
      return Response.json({ error: "Invalid theme" }, { status: 400 });
    }
    update.theme = body.theme;
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  await db
    .update(users)
    .set(update)
    .where(eq(users.id, auth.userId));

  return Response.json(update);
}
