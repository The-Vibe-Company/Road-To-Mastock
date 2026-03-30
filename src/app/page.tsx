import Link from "next/link";
import { db } from "@/lib/db";
import { sessions, sessionExercises, users } from "@/lib/db/schema";
import { desc, eq, count } from "drizzle-orm";
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

  const allSessions = await db
    .select({
      id: sessions.id,
      date: sessions.date,
      exerciseCount: count(sessionExercises.id),
    })
    .from(sessions)
    .leftJoin(sessionExercises, eq(sessions.id, sessionExercises.sessionId))
    .where(eq(sessions.userId, auth.userId))
    .groupBy(sessions.id)
    .orderBy(desc(sessions.date), desc(sessions.createdAt));

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-28 pt-10">
      {/* Hero */}
      <div className="hero-gradient -mx-4 -mt-10 mb-8 px-4 pb-6 pt-12">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">
              ROAD TO{" "}
              <span className="text-gradient-orange">MASSIVE</span>
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
              exerciseCount={s.exerciseCount}
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
