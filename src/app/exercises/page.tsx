import Link from "next/link";
import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExerciseCatalog() {
  const allExercises = await db
    .select()
    .from(exercises)
    .orderBy(asc(exercises.muscleGroup), asc(exercises.name));

  const grouped: Record<string, typeof allExercises> = {};
  for (const ex of allExercises) {
    const key = ex.muscleGroup || "Autre";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ex);
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

      {Object.keys(grouped).length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Aucun exercice. Crée-en un depuis une séance.
        </p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([muscleGroup, exs]) => (
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
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{ex.name}</p>
                      {ex.muscleGroup && (
                        <Badge variant="outline" className="text-[10px]">
                          {ex.muscleGroup}
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-primary/40" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
