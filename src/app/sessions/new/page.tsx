"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ExercisePicker } from "@/components/exercise-picker";
import { ExerciseBlock } from "@/components/exercise-block";

interface ExerciseSet {
  id: number;
  setNumber: number;
  weightKg: number;
  reps: number;
}

interface SessionExercise {
  sessionExerciseId: number;
  exerciseId: number;
  name: string;
  nameFr: string;
  category: string;
  muscleGroup: string | null;
  sets: ExerciseSet[];
}

export default function NewSession() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create session on mount
  useEffect(() => {
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((s) => {
        setSessionId(s.id);
        setLoading(false);
      });
  }, []);

  const refreshSession = useCallback(async () => {
    if (!sessionId) return;
    const res = await fetch(`/api/sessions/${sessionId}`);
    const data = await res.json();
    setExercises(data.exercises || []);
  }, [sessionId]);

  const handleSelectExercise = async (exercise: {
    id: number;
    name: string;
    nameFr: string;
    category: string;
    muscleGroup: string | null;
  }) => {
    if (!sessionId) return;
    await fetch("/api/session-exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        exerciseId: exercise.id,
      }),
    });
    await refreshSession();
    setShowPicker(false);
  };

  const handleAddSet = async (
    sessionExerciseId: number,
    weightKg: number,
    reps: number
  ) => {
    await fetch("/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionExerciseId, weightKg, reps }),
    });
    await refreshSession();
  };

  const handleDeleteSet = async (setId: number) => {
    await fetch(`/api/sets/${setId}`, { method: "DELETE" });
    await refreshSession();
  };

  const handleRemoveExercise = async (sessionExerciseId: number) => {
    await fetch(`/api/session-exercises/${sessionExerciseId}`, {
      method: "DELETE",
    });
    await refreshSession();
  };

  const handleFinish = () => {
    if (sessionId) {
      router.push(`/sessions/${sessionId}`);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionId) return;
    await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-zinc-400">Création de la séance...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-24 pt-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Séance en cours</h1>
          <p className="text-xs text-zinc-500">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <button
          onClick={handleDeleteSession}
          className="rounded-lg px-3 py-1.5 text-sm text-red-500 active:bg-red-50"
        >
          Annuler
        </button>
      </div>

      {/* Exercises */}
      {exercises.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-2 text-4xl">🏋️</p>
          <p className="text-sm text-zinc-400">
            Ajoute ton premier exercice pour commencer
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((ex) => (
            <ExerciseBlock
              key={ex.sessionExerciseId}
              sessionExerciseId={ex.sessionExerciseId}
              name={ex.name}
              nameFr={ex.nameFr}
              category={ex.category}
              muscleGroup={ex.muscleGroup}
              sets={ex.sets}
              onAddSet={handleAddSet}
              onDeleteSet={handleDeleteSet}
              onRemoveExercise={handleRemoveExercise}
            />
          ))}
        </div>
      )}

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-lg gap-2">
          <button
            onClick={() => setShowPicker(true)}
            className="flex-1 rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-700 active:bg-zinc-200"
          >
            + Exercice
          </button>
          {exercises.length > 0 && (
            <button
              onClick={handleFinish}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white active:bg-primary-dark"
            >
              Terminer
            </button>
          )}
        </div>
      </div>

      {/* Picker modal */}
      {showPicker && (
        <ExercisePicker
          onSelect={handleSelectExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
