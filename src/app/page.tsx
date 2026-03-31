import Link from "next/link";
import { db } from "@/lib/db";
import { sessions, sessionExercises, sets, users } from "@/lib/db/schema";
import { desc, eq, count, sum, sql } from "drizzle-orm";
import { SessionCard } from "@/components/session-card";
import { Button } from "@/components/ui/button";
import { Plus, Dumbbell, BookOpen } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const auth = await getAuthUser();
  if (!auth) redirect("/login");

  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, auth.userId));

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
      {/* Hero */}
      <div className="hero-gradient -mx-4 -mt-10 mb-8 px-4 pb-6 pt-12">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">
              ROAD TO{" "}
              <span className="text-gradient-orange">MASTOCK</span>
            </h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {user?.name ? `Hey ${user.name}` : "Tes séances"} — {allSessions.length} séance{allSessions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/exercises">
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary"
              >
                <BookOpen className="size-5" />
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>

      {allSessions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Dumbbell className="size-8 text-primary/50" />
          </div>
          <div>
            <p className="font-semibold">Aucune séance</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Commence ta première séance
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {allSessions.map((s) => (
            <SessionCard
              key={s.id}
              id={s.id}
              date={s.date}
              exerciseCount={Number(s.exercise_count)}
              totalVolume={Math.round(Number(s.total_volume))}
              gold={Number(s.gold)}
              silver={Number(s.silver)}
              bronze={Number(s.bronze)}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <Link href="/sessions/new">
          <Button
            size="lg"
            className="h-14 rounded-2xl bg-gradient-orange-intense px-8 text-base font-bold tracking-tight text-black shadow-2xl glow-orange"
          >
            <Plus className="size-5" strokeWidth={3} />
            Nouvelle séance
          </Button>
        </Link>
      </div>
    </div>
  );
}
