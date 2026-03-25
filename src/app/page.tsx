import Link from "next/link";
import { db } from "@/lib/db";
import { sessions, sessionExercises } from "@/lib/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { SessionCard } from "@/components/session-card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allSessions = await db
    .select({
      id: sessions.id,
      date: sessions.date,
      exerciseCount: count(sessionExercises.id),
    })
    .from(sessions)
    .leftJoin(sessionExercises, eq(sessions.id, sessionExercises.sessionId))
    .groupBy(sessions.id)
    .orderBy(desc(sessions.date), desc(sessions.createdAt));

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-24 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">BasicFit Tracker</h1>
        <p className="text-sm text-zinc-500">Tes séances de musculation</p>
      </div>

      {/* Sessions list */}
      {allSessions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-2 text-4xl">💪</p>
          <p className="text-lg font-medium text-zinc-600">Aucune séance</p>
          <p className="text-sm text-zinc-400">
            Commence ta première séance !
          </p>
        </div>
      ) : (
        <div className="space-y-2">
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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <Link
          href="/sessions/new"
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg active:bg-primary-dark"
        >
          <span className="text-lg">+</span>
          Nouvelle séance
        </Link>
      </div>
    </div>
  );
}
