import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { ACCENT_PRESETS, SEALED_ACCENTS, isCustomAccent } from "@/lib/colors";
import { unlockedAccents, unlockedTalents } from "@/lib/talents-server";
import { earnedTrophies } from "@/lib/trophies-server";
import { hasTrophyFeature, trophyTitles, unlockedTrophyColors } from "@/lib/trophies";
import { ownsCard, type MascotCategory } from "@/lib/mascots";

// Titres du Règne (aura du Dragon ancestral).
const REGNE_TITLES = [
  "Maître de la salle",
  "Dompteur de fonte",
  "Seigneur des machines",
  "Éveilleur de gardiens",
  "Chasseur de records",
  "Gardien du chapeau",
];

// Trônes valides par page — l'id du talent qui les débloque.
const WALLPAPERS: Record<string, string[]> = {
  home: ["serpent-monde", "traversee"],
  session: ["jardin", "etreinte"],
  collection: ["mere-dragons"],
};

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db
    .select({
      accentColor: users.accentColor,
      theme: users.theme,
      title: users.title,
      weeklyGoal: users.weeklyGoal,
    })
    .from(users)
    .where(eq(users.id, auth.userId));

  // Les titres disponibles : ceux du Règne (talent du Dragon ancestral) et
  // ceux gagnés au cabinet des trophées.
  const [talents, trophies] = await Promise.all([
    unlockedTalents(auth.userId),
    earnedTrophies(auth.userId),
  ]);
  const titles = [
    ...(talents.some((t) => t.id === "regne") ? REGNE_TITLES : []),
    ...trophyTitles(trophies),
  ];

  return Response.json({
    accentColor: user?.accentColor || "orange",
    theme: user?.theme || "dark",
    title: user?.title ?? null,
    weeklyGoal: user?.weeklyGoal ?? null,
    titles,
    // Le mode clair est scellé jusqu'à la centième séance.
    lightUnlocked: hasTrophyFeature(trophies, "light"),
  });
}

export async function PATCH(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const update: Partial<{
    accentColor: string;
    theme: string;
    bannerCategory: string | null;
    bannerCardId: number | null;
    totemCategory: string | null;
    totemCardId: number | null;
    title: string | null;
    weeklyGoal: number | null;
    wallpaperHome: string | null;
    wallpaperSession: string | null;
    wallpaperCollection: string | null;
  }> = {};

  if (body.accentColor) {
    if (ACCENT_PRESETS[body.accentColor]) {
      // Les couleurs de base se gagnent au cabinet des trophées : le
      // sélecteur à 10 séances, puis les teintes par paliers.
      const trophies = await earnedTrophies(auth.userId);
      if (!unlockedTrophyColors(trophies).has(body.accentColor)) {
        return Response.json({ error: "Couleur non débloquée — voir les trophées" }, { status: 403 });
      }
      update.accentColor = body.accentColor;
    } else if (SEALED_ACCENTS[body.accentColor]) {
      // Parure scellée : le talent (la carte) doit être possédé.
      const unlocked = await unlockedAccents(auth.userId);
      if (!unlocked.has(body.accentColor)) {
        return Response.json({ error: "Parure non débloquée" }, { status: 403 });
      }
      update.accentColor = body.accentColor;
    } else if (isCustomAccent(body.accentColor)) {
      // La roue chromatique libre exige l'Alpha.
      const talents = await unlockedTalents(auth.userId);
      if (!talents.some((t) => t.id === "alpha")) {
        return Response.json({ error: "Parure non débloquée" }, { status: 403 });
      }
      update.accentColor = body.accentColor;
    } else {
      return Response.json({ error: "Invalid color" }, { status: 400 });
    }
  }

  // ── Privilèges des Talents : chacun exige son aura ──
  const needsTalents =
    "totem" in body || "title" in body || "weeklyGoal" in body || "wallpapers" in body;
  const owned = needsTalents ? (await unlockedTalents(auth.userId)).map((x) => x.id) : [];

  if ("banner" in body) {
    // L'Étendard : la carte en bannière sur la home — trophée requis.
    const trophies = await earnedTrophies(auth.userId);
    if (!hasTrophyFeature(trophies, "banner")) {
      return Response.json({ error: "Trophée requis" }, { status: 403 });
    }
    if (body.banner === null) {
      update.bannerCategory = null;
      update.bannerCardId = null;
    } else if (
      body.banner &&
      (body.banner.category === "animal" || body.banner.category === "pokemon") &&
      Number.isInteger(body.banner.id)
    ) {
      if (!(await ownsCard(auth.userId, body.banner.category as MascotCategory, body.banner.id))) {
        return Response.json({ error: "Carte non possédée" }, { status: 403 });
      }
      update.bannerCategory = body.banner.category;
      update.bannerCardId = body.banner.id;
    }
  }

  if ("totem" in body) {
    if (!owned.includes("totem")) {
      return Response.json({ error: "Talent requis" }, { status: 403 });
    }
    if (body.totem === null) {
      update.totemCategory = null;
      update.totemCardId = null;
    } else if (
      body.totem &&
      (body.totem.category === "animal" || body.totem.category === "pokemon") &&
      Number.isInteger(body.totem.id)
    ) {
      if (!(await ownsCard(auth.userId, body.totem.category as MascotCategory, body.totem.id))) {
        return Response.json({ error: "Carte non possédée" }, { status: 403 });
      }
      update.totemCategory = body.totem.category;
      update.totemCardId = body.totem.id;
    }
  }

  if ("title" in body) {
    const trophies = await earnedTrophies(auth.userId);
    const allowed = [
      ...(owned.includes("regne") ? REGNE_TITLES : []),
      ...trophyTitles(trophies),
    ];
    if (body.title === null) update.title = null;
    else if (allowed.includes(body.title)) update.title = body.title;
    else return Response.json({ error: "Titre non gagné" }, { status: 403 });
  }

  if ("weeklyGoal" in body) {
    if (!owned.includes("resolution")) {
      return Response.json({ error: "Talent requis" }, { status: 403 });
    }
    if (body.weeklyGoal === null) update.weeklyGoal = null;
    else if (Number.isInteger(body.weeklyGoal) && body.weeklyGoal >= 1 && body.weeklyGoal <= 7) {
      update.weeklyGoal = body.weeklyGoal;
    } else return Response.json({ error: "Objectif invalide" }, { status: 400 });
  }

  if ("wallpapers" in body && body.wallpapers && typeof body.wallpapers === "object") {
    for (const [page, talentId] of Object.entries(body.wallpapers) as [string, string | null][]) {
      if (!(page in WALLPAPERS)) continue;
      if (talentId !== null && (!WALLPAPERS[page].includes(talentId) || !owned.includes(talentId))) {
        return Response.json({ error: "Trône non débloqué" }, { status: 403 });
      }
      if (page === "home") update.wallpaperHome = talentId;
      if (page === "session") update.wallpaperSession = talentId;
      if (page === "collection") update.wallpaperCollection = talentId;
    }
  }

  if (body.theme) {
    if (body.theme !== "dark" && body.theme !== "light") {
      return Response.json({ error: "Invalid theme" }, { status: 400 });
    }
    if (body.theme === "light") {
      const earned = await earnedTrophies(auth.userId);
      if (!hasTrophyFeature(earned, "light")) {
        return Response.json(
          { error: "Le mode clair se gagne — 100 séances." },
          { status: 403 },
        );
      }
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
