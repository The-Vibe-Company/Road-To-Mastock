import Link from "next/link";
import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORY_FR: Record<string, string> = {
  "Upper Body": "Haut du corps",
  "Lower Body": "Bas du corps",
  Core: "Core",
  Cardio: "Cardio",
  "Free Weights": "Poids libres",
};

export default async function ExerciseCatalog() {
  const allExercises = await db
    .select()
    .from(exercises)
    .orderBy(asc(exercises.category), asc(exercises.muscleGroup), asc(exercises.sortOrder));

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
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Retour
      </Link>
      <h1 className="mb-6 text-2xl font-black tracking-tight">Catalogue</h1>

      <div className="space-y-8">
        {Object.entries(tree).map(([category, groups]) => (
          <div key={category}>
            <div className="mb-3">
              <Badge
                variant="secondary"
                className="bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
              >
                {CATEGORY_FR[category] || category}
              </Badge>
            </div>

            <div className="space-y-3">
              {Object.entries(groups).map(([muscleGroup, exs]) => (
                <Card key={muscleGroup} className="card-glow">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">
                      {muscleGroup}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0.5">
                    {exs.map((ex) => (
                      <Link
                        key={ex.id}
                        href={`/exercises/${ex.id}`}
                        className="flex items-center justify-between rounded-xl px-3 py-3 transition-all hover:bg-accent active:scale-[0.97]"
                      >
                        <div>
                          <p className="font-bold">{ex.nameFr}</p>
                          <p className="text-xs text-muted-foreground">{ex.name}</p>
                        </div>
                        <ChevronRight className="size-4 text-primary/40" />
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
