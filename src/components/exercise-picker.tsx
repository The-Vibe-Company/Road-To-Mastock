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
import { Plus, Search, Flame, Loader2, Activity, MapPin } from "@/components/icons";
import { MUSCLE_GROUPS } from "@/lib/muscle-groups";

interface Exercise {
  id: number;
  name: string;
  kind?: "muscu" | "cardio";
  hasVariants?: boolean;
  muscleGroup: string | null;
  muscleGroups: string[];
}

interface Variant {
  id: number;
  name: string;
}

interface FrequentExercise extends Exercise {
  useCount: number;
}

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercise: Exercise, variantId: number | null) => void | Promise<void>;
}

export function ExercisePicker({ open, onOpenChange, onSelect }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [frequentExercises, setFrequentExercises] = useState<FrequentExercise[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscles, setNewMuscles] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [selectingId, setSelectingId] = useState<number | null>(null);
  // Machine qui change selon la salle : on demande laquelle avant d'ajouter.
  const [variantFor, setVariantFor] = useState<Exercise | null>(null);
  const [variantOptions, setVariantOptions] = useState<Variant[]>([]);
  const [newVariant, setNewVariant] = useState("");

  useEffect(() => {
    if (open) {
      setSelectingId(null);
      setVariantFor(null);
      setNewVariant("");
      setSearch("");
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

  const handleSelect = async (exercise: Exercise) => {
    if (selectingId !== null) return;

    if (exercise.hasVariants) {
      const res = await fetch(`/api/exercises/${exercise.id}/variants`);
      const data = res.ok ? await res.json() : [];
      setVariantOptions(Array.isArray(data) ? data : []);
      setVariantFor(exercise);
      return;
    }

    setSelectingId(exercise.id);
    try {
      await onSelect(exercise, null);
      setSearch("");
    } finally {
      setSelectingId(null);
    }
  };

  const chooseVariant = async (variantId: number | null) => {
    const exercise = variantFor;
    if (!exercise || selectingId !== null) return;
    setSelectingId(exercise.id);
    try {
      await onSelect(exercise, variantId);
      setVariantFor(null);
      setNewVariant("");
      setSearch("");
    } finally {
      setSelectingId(null);
    }
  };

  const createVariantAndSelect = async () => {
    const name = newVariant.trim();
    if (!name || !variantFor || selectingId !== null) return;
    const res = await fetch(`/api/exercises/${variantFor.id}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const created = res.ok ? await res.json() : null;
    if (created?.id) await chooseVariant(created.id);
  };

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), muscleGroups: newMuscles }),
    });
    const exercise = await res.json();
    setNewName("");
    setNewMuscles([]);
    setShowCreate(false);
    try {
      await onSelect(exercise, null);
    } finally {
      setCreating(false);
    }
  };

  const toggleNewMuscle = (mg: string) => {
    setNewMuscles((prev) =>
      prev.includes(mg) ? prev.filter((m) => m !== mg) : [...prev, mg]
    );
  };

  // Recherche insensible aux accents ET à la casse : « developpe » doit
  // trouver « Développé couché ».
  const fold = (v: string) =>
    v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtered = search
    ? exercises.filter((e) => fold(e.name).includes(fold(search)))
    : exercises;

  const cardioExercises = filtered.filter((e) => e.kind === "cardio");
  const muscuExercises = filtered.filter((e) => e.kind !== "cardio");

  const grouped = muscuExercises.reduce(
    (acc, e) => {
      const tags = e.muscleGroups.length > 0 ? e.muscleGroups : ["Autre"];
      for (const key of tags) {
        if (!acc[key]) acc[key] = [];
        acc[key].push(e);
      }
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
              <Plus className="size-4" />
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
              <p className="mb-2 text-xs font-bold text-muted-foreground">Muscles ciblés</p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {MUSCLE_GROUPS.map((mg) => (
                  <button
                    key={mg}
                    onClick={() => toggleNewMuscle(mg)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                      newMuscles.includes(mg)
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

          {/* Choix de la salle, pour les machines qui changent d'une salle a
              l'autre. On remplace la liste tant que le choix n'est pas fait. */}
          {variantFor && (
            <div className="rounded-2xl border border-primary/20 bg-secondary/30 p-4">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-bold">
                <MapPin className="size-4 text-primary" />
                {variantFor.name}
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Cette machine change selon la salle. Laquelle aujourd&apos;hui ?
              </p>

              {variantOptions.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {variantOptions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => chooseVariant(v.id)}
                      disabled={selectingId !== null}
                      className="rounded-lg bg-gradient-orange-intense px-3 py-2 text-xs font-bold text-black shadow-lg transition-all active:scale-95 disabled:opacity-60"
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              )}

              <form
                className="mb-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  createVariantAndSelect();
                }}
              >
                <Input
                  placeholder="Nouvelle salle"
                  value={newVariant}
                  onChange={(e) => setNewVariant(e.target.value)}
                  className="h-10 bg-secondary/50 text-sm font-medium"
                />
                <Button
                  type="submit"
                  disabled={!newVariant.trim() || selectingId !== null}
                  className="h-10 shrink-0 bg-secondary px-3 font-bold"
                >
                  <Plus className="size-4" strokeWidth={3} />
                </Button>
              </form>

              <div className="flex gap-3">
                <button
                  onClick={() => setVariantFor(null)}
                  disabled={selectingId !== null}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Retour
                </button>
                <button
                  onClick={() => chooseVariant(null)}
                  disabled={selectingId !== null}
                  className="text-xs font-bold text-muted-foreground hover:text-primary disabled:opacity-50"
                >
                  Sans preciser
                </button>
              </div>
            </div>
          )}

          {/* List */}
          <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6 ${variantFor ? "hidden" : ""}`}>
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
                      onClick={() => handleSelect(ex)}
                      disabled={selectingId !== null}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left transition-all hover:bg-accent active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-bold">{ex.name}</p>
                        {ex.muscleGroups.map((mg) => (
                          <Badge key={mg} variant="outline" className="text-[10px]">{mg}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {ex.useCount}x
                        </span>
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                          {selectingId === ex.id ? (
                            <Loader2 className="size-4 animate-spin text-primary" />
                          ) : (
                            <Plus className="size-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cardio section */}
            {cardioExercises.length > 0 && (
              <div className="mb-5">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary/60">
                  <Activity className="size-3.5" />
                  Cardio
                </p>
                <div className="space-y-1">
                  {cardioExercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleSelect(ex)}
                      disabled={selectingId !== null}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left transition-all hover:bg-accent active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
                    >
                      <p className="font-bold">{ex.name}</p>
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        {selectingId === ex.id ? (
                          <Loader2 className="size-4 animate-spin text-primary" />
                        ) : (
                          <Plus className="size-4 text-primary" />
                        )}
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
                      onClick={() => handleSelect(ex)}
                      disabled={selectingId !== null}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left transition-all hover:bg-accent active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-bold">{ex.name}</p>
                        {ex.muscleGroups
                          .filter((mg) => mg !== group)
                          .map((mg) => (
                            <Badge key={mg} variant="outline" className="text-[10px]">{mg}</Badge>
                          ))}
                      </div>
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        {selectingId === ex.id ? (
                          <Loader2 className="size-4 animate-spin text-primary" />
                        ) : (
                          <Plus className="size-4 text-primary" />
                        )}
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
