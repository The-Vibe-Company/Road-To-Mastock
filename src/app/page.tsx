import Link from "next/link";
import { db } from "@/lib/db";
import { animals, pokemon, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { earnedTrophies } from "@/lib/trophies-server";
import { hasTrophyFeature } from "@/lib/trophies";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Settings, Cards, Trophy } from "@/components/icons";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { HomeTabs } from "@/components/home-tabs";
import { NewSessionButton } from "@/components/new-session-button";
import { RefreshOnReturn } from "@/components/refresh-on-return";
import { HomeExtras, HomeTrinkets } from "@/components/home-extras";

export const dynamic = "force-dynamic";

export default async function Home() {
  const auth = await getAuthUser();
  if (!auth) redirect("/login");

  const [user] = await db
    .select({
      name: users.name,
      title: users.title,
      bannerCategory: users.bannerCategory,
      bannerCardId: users.bannerCardId,
    })
    .from(users)
    .where(eq(users.id, auth.userId));

  // L'Étendard : la carte en bannière derrière le titre.
  let bannerUrl: string | null = null;
  if (user?.bannerCategory && user.bannerCardId) {
    const table = user.bannerCategory === "animal" ? animals : pokemon;
    const [card] = await db
      .select({ imageUrl: table.imageUrl })
      .from(table)
      .where(eq(table.id, user.bannerCardId));
    bannerUrl = card?.imageUrl ?? null;
  }

  // Le bilan hebdo (trophée Le Mois Parfait) : cette semaine vs la dernière.
  const trophies = await earnedTrophies(auth.userId);
  let weekly: { sessions: number; volume: number; prevSessions: number; prevVolume: number } | null = null;
  if (hasTrophyFeature(trophies, "weekly")) {
    const res = (await db.execute(sql`
      SELECT
        COUNT(DISTINCT s.id) FILTER (WHERE DATE_TRUNC('week', s.date::timestamp) = DATE_TRUNC('week', NOW()))::int AS sessions,
        COALESCE(SUM(st.weight_kg * st.reps) FILTER (WHERE DATE_TRUNC('week', s.date::timestamp) = DATE_TRUNC('week', NOW())), 0)::float AS volume,
        COUNT(DISTINCT s.id) FILTER (WHERE DATE_TRUNC('week', s.date::timestamp) = DATE_TRUNC('week', NOW() - INTERVAL '7 days'))::int AS prev_sessions,
        COALESCE(SUM(st.weight_kg * st.reps) FILTER (WHERE DATE_TRUNC('week', s.date::timestamp) = DATE_TRUNC('week', NOW() - INTERVAL '7 days')), 0)::float AS prev_volume
      FROM sessions s
      LEFT JOIN session_exercises se ON se.session_id = s.id
      LEFT JOIN sets st ON st.session_exercise_id = se.id
      WHERE s.user_id = ${auth.userId}
    `)) as unknown as { rows?: Record<string, unknown>[] };
    const w = ((res.rows ?? res) as unknown as { sessions: number; volume: number; prev_sessions: number; prev_volume: number }[])[0];
    weekly = {
      sessions: Number(w?.sessions ?? 0),
      volume: Math.round(Number(w?.volume ?? 0)),
      prevSessions: Number(w?.prev_sessions ?? 0),
      prevVolume: Math.round(Number(w?.prev_volume ?? 0)),
    };
  }

  const result = await db.execute(sql`
    WITH exercise_rankings AS (
      SELECT
        se.id AS se_id,
        se.session_id,
        se.exercise_id,
        COALESCE(MAX(st.weight_kg), 0) AS max_weight,
        COALESCE(SUM(st.weight_kg * st.reps), 0) AS total_volume
      FROM session_exercises se
      JOIN sessions s ON s.id = se.session_id
      LEFT JOIN sets st ON st.session_exercise_id = se.id
      WHERE s.user_id = ${auth.userId}
      GROUP BY se.id, se.session_id, se.exercise_id
    ),
    ranked AS (
      SELECT
        se_id,
        session_id,
        LEAST(
          RANK() OVER (PARTITION BY exercise_id ORDER BY max_weight DESC),
          RANK() OVER (PARTITION BY exercise_id ORDER BY total_volume DESC)
        ) AS best_rank
      FROM exercise_rankings
      WHERE max_weight > 0
    )
    SELECT
      s.id,
      s.date,
      (SELECT COUNT(*) FROM session_exercises se WHERE se.session_id = s.id) AS exercise_count,
      COALESCE((
        SELECT SUM(st.weight_kg * st.reps)
        FROM sets st
        JOIN session_exercises se ON se.id = st.session_exercise_id
        WHERE se.session_id = s.id
      ), 0) AS total_volume,
      COALESCE((SELECT COUNT(*) FROM ranked r WHERE r.session_id = s.id AND r.best_rank = 1), 0) AS gold,
      COALESCE((SELECT COUNT(*) FROM ranked r WHERE r.session_id = s.id AND r.best_rank = 2), 0) AS silver,
      COALESCE((SELECT COUNT(*) FROM ranked r WHERE r.session_id = s.id AND r.best_rank = 3), 0) AS bronze
    FROM sessions s
    WHERE s.user_id = ${auth.userId}
    ORDER BY s.date DESC, s.created_at DESC
  `);
  const allSessions = (result.rows ?? result) as unknown as { id: number; date: string; exercise_count: number; total_volume: number; gold: number; silver: number; bronze: number }[];

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-28 pt-10">
      <RefreshOnReturn />
      {/* Hero — l'affiche : titre pleine largeur, puis la rangée d'outils */}
      <div className="hero-gradient relative -mx-4 -mt-10 mb-8 overflow-hidden px-4 pb-6 pt-12">
        {/* L'Étendard : la carte flotte derrière le titre */}
        {/* L'Étendard : la carte choisie habille TOUTE la home — plein
            écran, fondue vers le bas pour laisser respirer le contenu. */}
        {bannerUrl && (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 select-none"
            style={{
              maskImage:
                "linear-gradient(to bottom, black, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0.35) 85%, rgba(0,0,0,0.15))",
              WebkitMaskImage:
                "linear-gradient(to bottom, black, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0.35) 85%, rgba(0,0,0,0.15))",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerUrl} alt="" className="size-full object-cover opacity-30" />
          </div>
        )}
        <h1 className="text-4xl leading-[0.95] tracking-tight">
          ROAD TO <span className="text-gradient-orange">MASTOCK</span>
        </h1>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              {user?.name ? `Hey ${user.name}` : "Tes séances"} — {allSessions.length} séance{allSessions.length !== 1 ? "s" : ""}
            </p>
            {user?.title && (
              <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                {user.title}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Link href="/friends">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary"
              >
                <Users className="size-5" />
              </Button>
            </Link>
            <Link href="/trophees">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary"
              >
                <Trophy className="size-5" />
              </Button>
            </Link>
            <Link href="/collection">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary"
              >
                <Cards className="size-5" />
              </Button>
            </Link>
            <Link href="/exercises">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary"
              >
                <BookOpen className="size-5" />
              </Button>
            </Link>
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary"
              >
                <Settings className="size-5" />
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>

      <HomeExtras />

      {/* Le bilan hebdo — gagné avec « Le Mois Parfait » */}
      {weekly && (
        <div className="mb-4 flex items-center gap-4 rounded-2xl bg-secondary/30 px-4 py-3 ring-1 ring-border">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Cette semaine
            </p>
            <p className="text-lg font-black leading-tight text-primary">
              {weekly.sessions} séance{weekly.sessions > 1 ? "s" : ""}
              <span className="text-muted-foreground"> · </span>
              {weekly.volume >= 1000 ? `${(weekly.volume / 1000).toFixed(1)}t` : `${weekly.volume}kg`}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Sem. dernière
            </p>
            <p className="text-sm font-bold leading-tight text-muted-foreground">
              {weekly.prevSessions} · {weekly.prevVolume >= 1000 ? `${(weekly.prevVolume / 1000).toFixed(1)}t` : `${weekly.prevVolume}kg`}
            </p>
          </div>
        </div>
      )}

      <HomeTabs
        sessions={allSessions.map((s) => ({
          id: Number(s.id),
          date: s.date,
          exerciseCount: Number(s.exercise_count),
          totalVolume: Math.round(Number(s.total_volume)),
          gold: Number(s.gold),
          silver: Number(s.silver),
          bronze: Number(s.bronze),
        }))}
      />

      <HomeTrinkets />

      {/* FAB */}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <NewSessionButton />
      </div>
    </div>
  );
}
