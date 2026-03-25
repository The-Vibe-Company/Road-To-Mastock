"use client";

import { useState, useEffect } from "react";

interface Exercise {
  id: number;
  category: string;
  muscleGroup: string | null;
  name: string;
  nameFr: string;
}

interface ExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

const CATEGORIES = ["Upper Body", "Lower Body", "Core", "Cardio", "Free Weights"];

const CATEGORY_FR: Record<string, string> = {
  "Upper Body": "Haut du corps",
  "Lower Body": "Bas du corps",
  Core: "Abdos / Core",
  Cardio: "Cardio",
  "Free Weights": "Poids libres",
};

export function ExercisePicker({ onSelect, onClose }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.json())
      .then(setExercises);
  }, []);

  const filtered = search
    ? exercises.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.nameFr.toLowerCase().includes(search.toLowerCase())
      )
    : activeCategory
      ? exercises.filter((e) => e.category === activeCategory)
      : [];

  // Group by muscle group
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
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-lg font-semibold">Ajouter un exercice</h2>
        <button
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 active:bg-zinc-100"
        >
          Fermer
        </button>
      </div>

      {/* Search */}
      <div className="border-b border-zinc-200 px-4 py-2">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value) setActiveCategory(null);
          }}
          className="w-full rounded-lg bg-zinc-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 px-4 py-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-zinc-100 text-zinc-600 active:bg-zinc-200"
              }`}
            >
              {CATEGORY_FR[cat]}
            </button>
          ))}
        </div>
      )}

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!search && !activeCategory && (
          <p className="py-8 text-center text-sm text-zinc-400">
            Sélectionne une catégorie ou recherche un exercice
          </p>
        )}
        {Object.entries(grouped).map(([group, exs]) => (
          <div key={group} className="mb-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {group}
            </h3>
            <div className="space-y-1">
              {exs.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => onSelect(ex)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left active:bg-zinc-50"
                >
                  <div>
                    <p className="text-sm font-medium">{ex.nameFr}</p>
                    <p className="text-xs text-zinc-400">{ex.name}</p>
                  </div>
                  <span className="text-lg text-primary">+</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
