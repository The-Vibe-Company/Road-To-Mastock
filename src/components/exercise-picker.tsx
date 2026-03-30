"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

interface Exercise {
  id: number;
  category: string;
  muscleGroup: string | null;
  name: string;
  nameFr: string;
}

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercise: Exercise) => void;
}

const CATEGORIES = ["Upper Body", "Lower Body", "Core", "Cardio", "Free Weights"];
const CATEGORY_FR: Record<string, string> = {
  "Upper Body": "Haut du corps",
  "Lower Body": "Bas du corps",
  Core: "Core",
  Cardio: "Cardio",
  "Free Weights": "Poids libres",
};

export function ExercisePicker({ open, onOpenChange, onSelect }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open && exercises.length === 0) {
      fetch("/api/exercises")
        .then((r) => r.json())
        .then(setExercises);
    }
  }, [open, exercises.length]);

  const filtered = search
    ? exercises.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.nameFr.toLowerCase().includes(search.toLowerCase())
      )
    : activeCategory
      ? exercises.filter((e) => e.category === activeCategory)
      : [];

  const grouped = filtered.reduce(
    (acc, e) => {
      const key = e.muscleGroup || "General";
      if (!acc[key]) acc[key] = [];
      acc[key].push(e);
      return acc;
    },
    {} as Record<string, Exercise[]>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] rounded-t-3xl border-t-2 border-t-primary/20">
        <SheetHeader>
          <SheetTitle className="text-xl font-black tracking-tight">
            Ajouter un exercice
          </SheetTitle>
          <SheetDescription className="sr-only">
            Sélectionner un exercice à ajouter
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-hidden px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value) setActiveCategory(null);
              }}
              className="h-11 bg-secondary/50 pl-10 font-medium"
            />
          </div>

          {!search && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "secondary"}
                  size="xs"
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 rounded-xl px-4 font-bold ${
                    activeCategory === cat
                      ? "bg-gradient-orange-intense text-black shadow-lg"
                      : "hover:bg-accent"
                  }`}
                >
                  {CATEGORY_FR[cat]}
                </Button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {!search && !activeCategory && (
              <p className="py-16 text-center text-sm font-medium text-muted-foreground">
                Sélectionne une catégorie
              </p>
            )}
            {Object.entries(grouped).map(([group, exs]) => (
              <div key={group} className="mb-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary/60">
                  {group}
                </p>
                <div className="space-y-1">
                  {exs.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => onSelect(ex)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left transition-all hover:bg-accent active:scale-[0.97]"
                    >
                      <div>
                        <p className="font-bold">{ex.nameFr}</p>
                        <p className="text-xs text-muted-foreground">{ex.name}</p>
                      </div>
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <Plus className="size-4 text-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
