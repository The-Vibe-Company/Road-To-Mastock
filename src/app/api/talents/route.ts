import { db } from "@/lib/db";
import { animals, pokemon, sessions, users } from "@/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { unlockedTalentsWithCards } from "@/lib/talents-server";
import { TALENT_COUNT } from "@/lib/talents";

// Cartes liées à un talent dont l'UI a besoin de l'image (easter eggs,
// fonds d'écran, compagnons de home). Résolu côté serveur pour ne jamais
// exposer la correspondance des talents non découverts.
const ASSET_SLUGS: Record<string, { category: "animal" | "pokemon"; slug: string }> = {
  migraine:        { category: "pokemon", slug: "psyduck" },
  sourire:         { category: "animal",  slug: "axolotl" },
  sieste:          { category: "pokemon", slug: "snorlax" },
  berceuse:        { category: "pokemon", slug: "jigglypuff" },
  squatteur:       { category: "animal",  slug: "domestic-cat" },
  "serpent-monde": { category: "animal",  slug: "world-serpent" },
  traversee:       { category: "pokemon", slug: "lapras" },
  "mere-dragons":  { category: "animal",  slug: "tiamat" },
  jardin:          { category: "pokemon", slug: "shaymin-land" },
  etreinte:        { category: "animal",  slug: "kraken" },
  tonnage:         { category: "animal",  slug: "blue-whale" },
  anneaux:         { category: "pokemon", slug: "hoopa" },
  "vol-de-ziz":    { category: "animal",  slug: "ziz" },
  "flamme-v":      { category: "pokemon", slug: "victini" },
  songe:           { category: "animal",  slug: "baku" },
};

// Masse d'une baleine bleue adulte, pour le compteur du Tonnage.
const BLUE_WHALE_KG = 140000;

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const discoveredFull = await unlockedTalentsWithCards(auth.userId);
  const discovered = discoveredFull.map((d) => d.talent);
  const has = (id: string) => discovered.some((t) => t.id === id);

  // Images des cartes liées aux talents découverts uniquement.
  const assets: Record<string, string | null> = {};
  const wanted = Object.entries(ASSET_SLUGS).filter(([id]) => has(id));
  if (wanted.length > 0) {
    const animalSlugs = wanted.filter(([, v]) => v.category === "animal").map(([, v]) => v.slug);
    const pokemonSlugs = wanted.filter(([, v]) => v.category === "pokemon").map(([, v]) => v.slug);
    const aRows = animalSlugs.length
      ? await db.select({ slug: animals.slug, imageUrl: animals.imageUrl }).from(animals).where(inArray(animals.slug, animalSlugs))
      : [];
    const pRows = pokemonSlugs.length
      ? await db.select({ slug: pokemon.slug, imageUrl: pokemon.imageUrl }).from(pokemon).where(inArray(pokemon.slug, pokemonSlugs))
      : [];
    for (const [id, v] of wanted) {
      const row = v.category === "animal"
        ? aRows.find((r) => r.slug === v.slug)
        : pRows.find((r) => r.slug === v.slug);
      assets[id] = row?.imageUrl ?? null;
    }
  }

  // ── Extras de home, calculés seulement si le talent est possédé ──
  const home: Record<string, unknown> = {};

  if (has("sieste") || has("resolution")) {
    const [row] = await db
      .select({
        last: sql<string | null>`MAX(${sessions.date})`,
        thisWeek: sql<number>`COUNT(*) FILTER (
          WHERE ${sessions.tokensGrantedAt} IS NOT NULL
            AND DATE_TRUNC('week', ${sessions.date}::timestamp) = DATE_TRUNC('week', NOW())
        )::int`,
      })
      .from(sessions)
      .where(eq(sessions.userId, auth.userId));
    if (has("sieste")) {
      const last = row?.last ? new Date(row.last) : null;
      home.siesteDays = last
        ? Math.floor((Date.now() - last.getTime()) / 86400000)
        : null;
    }
    if (has("resolution")) home.weekSessions = row?.thisWeek ?? 0;
  }

  if (has("tonnage")) {
    const res = (await db.execute(sql`
      SELECT COALESCE(SUM(st.weight_kg * st.reps), 0)::float AS total
      FROM sets st
      JOIN session_exercises se ON se.id = st.session_exercise_id
      JOIN sessions s ON s.id = se.session_id
      WHERE s.user_id = ${auth.userId}
    `)) as unknown as { rows?: { total: number }[] };
    const rows = (res.rows ?? res) as unknown as { total: number }[];
    const total = Number(rows[0]?.total ?? 0);
    home.tonnageKg = Math.round(total);
    home.tonnageWhales = Number((total / BLUE_WHALE_KG).toFixed(2));
  }

  if (has("flamme-v")) {
    // Suite de séances consécutives dont chacune a battu au moins un record
    // au moment où elle a eu lieu.
    const res = (await db.execute(sql`
      WITH per_ex AS (
        SELECT se.exercise_id, se.variant_id, se.session_id, s.date, s.created_at,
               MAX(st.weight_kg) AS maxw, SUM(st.weight_kg * st.reps) AS vol
        FROM session_exercises se
        JOIN sessions s ON s.id = se.session_id
        JOIN sets st ON st.session_exercise_id = se.id
        WHERE s.user_id = ${auth.userId} AND st.weight_kg IS NOT NULL
        GROUP BY se.exercise_id, se.variant_id, se.session_id, s.date, s.created_at
      ),
      flagged AS (
        SELECT session_id, date, created_at,
          (maxw > COALESCE(MAX(maxw) OVER w, 0) OR vol > COALESCE(MAX(vol) OVER w, 0)) AS is_record
        FROM per_ex
        WINDOW w AS (
          PARTITION BY exercise_id, variant_id ORDER BY date, created_at
          ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        )
      )
      SELECT session_id, BOOL_OR(is_record) AS has_record
      FROM flagged
      GROUP BY session_id, date, created_at
      ORDER BY date DESC, created_at DESC
      LIMIT 365
    `)) as unknown as { rows?: { has_record: boolean }[] };
    const rows = (res.rows ?? res) as unknown as { has_record: boolean }[];
    let streak = 0;
    for (const r of rows) {
      if (r.has_record) streak++;
      else break;
    }
    home.recordStreak = streak;
  }

  if (has("songe")) {
    // Le rêve de Baku : une carte possédée, déterministe par jour.
    const owned = (await db.execute(sql`
      SELECT a.name, a.image_url AS "imageUrl", a.rarity FROM user_cards uc
      JOIN animals a ON a.id = uc.animal_id WHERE uc.user_id = ${auth.userId}
      UNION ALL
      SELECT p.name, p.image_url AS "imageUrl", p.rarity FROM user_pokemon_cards up
      JOIN pokemon p ON p.id = up.pokemon_id WHERE up.user_id = ${auth.userId}
      ORDER BY name
    `)) as unknown as { rows?: { name: string; imageUrl: string | null; rarity: string }[] };
    const rows = (owned.rows ?? owned) as unknown as { name: string; imageUrl: string | null; rarity: string }[];
    if (rows.length > 0) {
      const day = Math.floor(Date.now() / 86400000);
      home.dream = rows[day % rows.length];
    }
  }

  // ── Profil : privilèges configurés ──
  const [user] = await db
    .select({
      announcedTalents: users.announcedTalents,
      totemCategory: users.totemCategory,
      totemCardId: users.totemCardId,
      title: users.title,
      weeklyGoal: users.weeklyGoal,
      wallpaperHome: users.wallpaperHome,
      wallpaperSession: users.wallpaperSession,
      wallpaperCollection: users.wallpaperCollection,
    })
    .from(users)
    .where(eq(users.id, auth.userId));

  let totem: { name: string; imageUrl: string | null; rarity: string } | null = null;
  if (user?.totemCategory && user.totemCardId) {
    const table = user.totemCategory === "animal" ? animals : pokemon;
    const [card] = await db
      .select({ name: table.name, imageUrl: table.imageUrl, rarity: table.rarity })
      .from(table)
      .where(eq(table.id, user.totemCardId));
    totem = card ?? null;
  }

  // Talents jamais annoncés : présentés à la reconnexion, une seule fois.
  const announced = new Set((user?.announcedTalents ?? "").split(",").filter(Boolean));
  const unannounced = discovered.map((t) => t.id).filter((tid) => !announced.has(tid));

  return Response.json({
    total: TALENT_COUNT,
    discovered: discoveredFull.map(({ talent: t, card }) => ({
      id: t.id,
      family: t.family,
      name: t.name,
      description: t.description,
      effect: t.effect,
      card,
    })),
    unannounced,
    assets,
    home,
    profile: {
      totem,
      totemCategory: user?.totemCategory ?? null,
      totemCardId: user?.totemCardId ?? null,
      title: user?.title ?? null,
      weeklyGoal: user?.weeklyGoal ?? null,
      wallpapers: {
        home: user?.wallpaperHome ?? null,
        session: user?.wallpaperSession ?? null,
        collection: user?.wallpaperCollection ?? null,
      },
    },
  });
}
