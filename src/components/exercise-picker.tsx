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
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Flame, Sparkles } from "lucide-react";

interface Exercise {
  id: number;
  name: string;
  muscleGroup: string | null;
}

interface FrequentExercise extends Exercise {
  useCount: number;
}

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercise: Exercise) => void;
}

const MUSCLE_GROUPS = [
  "Pectoraux", "Dos", "Épaules", "Biceps", "Triceps",
  "Quadriceps", "Ischio-jambiers", "Fessiers", "Mollets",
  "Abdominaux", "Cardio",
];

export function ExercisePicker({ open, onOpenChange, onSelect }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [frequentExercises, setFrequentExercises] = useState<FrequentExercise[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/exercises")
        .then((r) => r.json())
        .then(setExercises);
      fetch("/api/exercises/frequent")
        .then((r) => r.json())
        .then((data: FrequentExercise[]) => {
          if (Array.isArray(data)) setFrequentExercises(data);
        });
    }
  }, [open]);

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), muscleGroup: newMuscle }),
    });
    const exercise = await res.json();
    setCreating(false);
    setNewName("");
    setNewMuscle(null);
    setShowCreate(false);
    onSelect(exercise);
  };

  const filtered = search
    ? exercises.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase())
      )
    : exercises;

  const grouped = filtered.reduce(
    (acc, e) => {
      const key = e.muscleGroup || "Autre";
      if (!acc[key]) acc[key] = [];
      acc[key].push(e);
      return acc;
    },
    {} as Record<string, Exercise[]>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="!h-[100dvh] rounded-t-3xl border-t-2 border-t-primary/20">
        <SheetHeader>
          <SheetTitle className="text-xl font-black tracking-tight">
            Ajouter un exercice
          </SheetTitle>
          <SheetDescription className="sr-only">
            Sélectionner ou créer un exercice
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4">
          {/* Search + Create button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 bg-secondary/50 pl-10 font-medium"
              />
            </div>
            <Button
              onClick={() => {
                setShowCreate(!showCreate);
                setNewName(search);
              }}
              className="h-11 shrink-0 bg-gradient-orange-intense px-4 font-bold text-black"
            >
              <Sparkles className="size-4" />
              Créer
            </Button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="rounded-2xl border border-primary/20 bg-secondary/30 p-4">
              <p className="mb-3 text-sm font-bold">Nouvel exercice</p>
              <Input
                placeholder="Nom de l'exercice"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mb-3 h-11 bg-secondary/50 font-medium"
                autoFocus
              />
              <p className="mb-2 text-xs font-bold text-muted-foreground">Muscle ciblé</p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {MUSCLE_GROUPS.map((mg) => (
                  <button
                    key={mg}
                    onClick={() => setNewMuscle(newMuscle === mg ? null : mg)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                      newMuscle === mg
                        ? "bg-gradient-orange-intense text-black shadow-lg"
                        : "bg-secondary/50 text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {mg}
                  </button>
                ))}
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="h-11 w-full bg-gradient-orange-intense font-bold text-black"
              >
                {creating ? "Création..." : "Ajouter"}
              </Button>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto pb-6">
            {/* Frequent exercises */}
            {!search && frequentExercises.length > 0 && (
              <div className="mb-5">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary/60">
                  <Flame className="size-3.5" />
                  Tes habituels
                </p>
                <div className="space-y-1">
                  {frequentExercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => onSelect(ex)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left transition-all hover:bg-accent active:scale-[0.97]"
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{ex.name}</p>
                        {ex.muscleGroup && (
                          <Badge variant="outline" className="text-[10px]">{ex.muscleGroup}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {ex.useCount}x
                        </span>
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                          <Plus className="size-4 text-primary" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All exercises grouped by muscle */}
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
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{ex.name}</p>
                        {ex.muscleGroup && (
                          <Badge variant="outline" className="text-[10px]">{ex.muscleGroup}</Badge>
                        )}
                      </div>
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <Plus className="size-4 text-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filtered.length === 0 && search && (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun exercice trouvé
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setShowCreate(true);
                    setNewName(search);
                  }}
                  className="mt-1 font-bold text-primary"
                >
                  Créer &quot;{search}&quot;
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
