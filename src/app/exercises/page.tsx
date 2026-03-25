import Link from "next/link";
import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { CategoryBadge } from "@/components/category-badge";

export const dynamic = "force-dynamic";

const CATEGORY_FR: Record<string, string> = {
  "Upper Body": "Haut du corps",
  "Lower Body": "Bas du corps",
  Core: "Abdos / Core",
  Cardio: "Cardio",
  "Free Weights": "Poids libres",
};

export default async function ExerciseCatalog() {
  const allExercises = await db
    .select()
    .from(exercises)
    .orderBy(
      asc(exercises.category),
      asc(exercises.muscleGroup),
      asc(exercises.sortOrder)
    );

  // Group: category -> muscleGroup -> exercises
  const tree: Record<string, Record<string, typeof allExercises>> = {};
  for (const ex of allExercises) {
    const cat = ex.category;
    const mg = ex.muscleGroup || "General";
    if (!tree[cat]) tree[cat] = {};
    if (!tree[cat][mg]) tree[cat][mg] = [];
    tree[cat][mg].push(ex);
  }

  return (
    <div className="min-h-dvh px-4 pb-8 pt-6">
      <Link
        href="/"
        className="mb-3 inline-block text-sm text-zinc-500 active:text-zinc-700"
      >
        &larr; Retour
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Catalogue des exercices</h1>

      <div className="space-y-6">
        {Object.entries(tree).map(([category, groups]) => (
          <div key={category}>
            <div className="mb-3 flex items-center gap-2">
              <CategoryBadge category={category} />
              <h2 className="text-lg font-semibold">
                {CATEGORY_FR[category] || category}
              </h2>
            </div>

            <div className="space-y-3">
              {Object.entries(groups).map(([muscleGroup, exs]) => (
                <div
                  key={muscleGroup}
                  className="rounded-xl border border-zinc-200 bg-white p-4"
                >
                  <h3 className="mb-2 text-sm font-semibold text-zinc-500">
                    {muscleGroup}
                  </h3>
                  <div className="space-y-2">
                    {exs.map((ex) => (
                      <div key={ex.id} className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium">{ex.nameFr}</p>
                          <p className="text-xs text-zinc-400">{ex.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
