"use client";

import { SetForm } from "./set-form";
import { SetRow } from "./set-row";
import { CategoryBadge } from "./category-badge";

interface ExerciseSet {
  id: number;
  setNumber: number;
  weightKg: number;
  reps: number;
}

interface ExerciseBlockProps {
  sessionExerciseId: number;
  name: string;
  nameFr: string;
  category: string;
  muscleGroup: string | null;
  sets: ExerciseSet[];
  onAddSet: (sessionExerciseId: number, weightKg: number, reps: number) => void;
  onDeleteSet: (setId: number) => void;
  onRemoveExercise: (sessionExerciseId: number) => void;
}

export function ExerciseBlock({
  sessionExerciseId,
  name,
  nameFr,
  category,
  muscleGroup,
  sets,
  onAddSet,
  onDeleteSet,
  onRemoveExercise,
}: ExerciseBlockProps) {
  const lastSet = sets[sets.length - 1];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{nameFr}</h3>
          <p className="text-xs text-zinc-500">{name}</p>
          <div className="mt-1 flex gap-1.5">
            <CategoryBadge category={category} />
            {muscleGroup && (
              <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {muscleGroup}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemoveExercise(sessionExerciseId)}
          className="rounded-lg px-2 py-1 text-xs text-red-500 active:bg-red-50"
        >
          Retirer
        </button>
      </div>

      {sets.length > 0 && (
        <div className="mb-3 border-t border-zinc-100 pt-2">
          {sets.map((s) => (
            <SetRow
              key={s.id}
              setNumber={s.setNumber}
              weightKg={s.weightKg}
              reps={s.reps}
              onDelete={() => onDeleteSet(s.id)}
            />
          ))}
        </div>
      )}

      <SetForm
        onAdd={(w, r) => onAddSet(sessionExerciseId, w, r)}
        lastWeight={lastSet?.weightKg}
        lastReps={lastSet?.reps}
      />
    </div>
  );
}
