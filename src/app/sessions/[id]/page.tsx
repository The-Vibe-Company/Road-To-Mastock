import Link from "next/link";
import { db } from "@/lib/db";
import { sessions, sessionExercises, sets, exercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CategoryBadge } from "@/components/category-badge";
import { DeleteSessionButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function SessionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessionId = parseInt(id);

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId));

  if (!session) notFound();

  const rows = await db
    .select({
      sessionExerciseId: sessionExercises.id,
      exerciseName: exercises.name,
      exerciseNameFr: exercises.nameFr,
      category: exercises.category,
      muscleGroup: exercises.muscleGroup,
      sortOrder: sessionExercises.sortOrder,
      setId: sets.id,
      setNumber: sets.setNumber,
      weightKg: sets.weightKg,
      reps: sets.reps,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .leftJoin(sets, eq(sets.sessionExerciseId, sessionExercises.id))
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(sessionExercises.sortOrder, sets.setNumber);

  // Group by exercise
  const grouped: {
    sessionExerciseId: number;
    name: string;
    nameFr: string;
    category: string;
    muscleGroup: string | null;
    sets: { setNumber: number; weightKg: number; reps: number }[];
  }[] = [];

  const map = new Map<number, (typeof grouped)[0]>();
  for (const row of rows) {
    if (!map.has(row.sessionExerciseId)) {
      const ex = {
        sessionExerciseId: row.sessionExerciseId,
        name: row.exerciseName,
        nameFr: row.exerciseNameFr,
        category: row.category,
        muscleGroup: row.muscleGroup,
        sets: [] as { setNumber: number; weightKg: number; reps: number }[],
      };
      map.set(row.sessionExerciseId, ex);
      grouped.push(ex);
    }
    if (row.setId) {
      map.get(row.sessionExerciseId)!.sets.push({
        setNumber: row.setNumber!,
        weightKg: row.weightKg!,
        reps: row.reps!,
      });
    }
  }

  const d = new Date(session.date);
  const formatted = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalSets = grouped.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalVolume = grouped.reduce(
    (sum, ex) =>
      sum + ex.sets.reduce((s, set) => s + set.weightKg * set.reps, 0),
    0
  );

  return (
    <div className="min-h-dvh px-4 pb-8 pt-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-block text-sm text-zinc-500 active:text-zinc-700"
        >
          &larr; Retour
        </Link>
        <h1 className="text-xl font-bold capitalize">{formatted}</h1>
        <div className="mt-2 flex gap-4 text-sm text-zinc-500">
          <span>{grouped.length} exercices</span>
          <span>{totalSets} séries</span>
          <span>{Math.round(totalVolume)} kg total</span>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {grouped.map((ex) => (
          <div
            key={ex.sessionExerciseId}
            className="rounded-xl border border-zinc-200 bg-white p-4"
          >
            <div className="mb-2">
              <h3 className="font-semibold">{ex.nameFr}</h3>
              <p className="text-xs text-zinc-400">{ex.name}</p>
              <div className="mt-1 flex gap-1.5">
                <CategoryBadge category={ex.category} />
                {ex.muscleGroup && (
                  <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                    {ex.muscleGroup}
                  </span>
                )}
              </div>
            </div>
            {ex.sets.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-zinc-400">
                    <th className="w-12 py-1 text-left font-normal">Série</th>
                    <th className="py-1 text-left font-normal">Poids</th>
                    <th className="py-1 text-left font-normal">Reps</th>
                  </tr>
                </thead>
                <tbody>
                  {ex.sets.map((s) => (
                    <tr key={s.setNumber} className="border-t border-zinc-50">
                      <td className="py-1.5 text-zinc-400">{s.setNumber}</td>
                      <td className="py-1.5 font-medium">{s.weightKg} kg</td>
                      <td className="py-1.5">{s.reps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>

      {/* Delete button */}
      <div className="mt-6">
        <DeleteSessionButton sessionId={sessionId} />
      </div>
    </div>
  );
}
