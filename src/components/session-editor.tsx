"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExercisePicker } from "./exercise-picker";
import { ExerciseBlock } from "./exercise-block";
import { DatePicker } from "./date-picker";
import { Plus, Trash2, ArrowLeft, Dumbbell, Activity, Weight, Layers, CalendarDays } from "lucide-react";
import Link from "next/link";

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
  muscleGroup: string | null;
  locked: boolean;
  record: number | null;
  sets: ExerciseSet[];
}

interface SessionData {
  id: number;
  date: string;
  exercises: SessionExercise[];
}

export function SessionEditor({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    const data = await res.json();
    setSession(data);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const handleSelectExercise = async (exercise: {
    id: number;
    name: string;
    muscleGroup: string | null;
  }) => {
    await fetch("/api/session-exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, exerciseId: exercise.id }),
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

  const handleToggleLock = async (sessionExerciseId: number, locked: boolean) => {
    await fetch(`/api/session-exercises/${sessionExerciseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked }),
    });
    await refreshSession();
  };

  const handleDeleteSession = async () => {
    if (!confirm("Supprimer cette séance ?")) return;
    await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm font-medium text-primary/60">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const exercises = session.exercises || [];
  const date = new Date(session.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const handleDateChange = async (newDate: string) => {
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate }),
    });
    await refreshSession();
  };

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalVolume = exercises.reduce(
    (sum, ex) =>
      sum + ex.sets.reduce((s, set) => s + set.weightKg * set.reps, 0),
    0
  );

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-24 pt-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/?tab=sessions"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Retour
        </Link>
        <div className="relative">
          <button
            type="button"
            className="group flex items-center gap-2 text-left"
            onClick={() => setShowDatePicker(true)}
          >
            <h1 className="text-2xl font-black capitalize tracking-tight">
              {date}
            </h1>
            <CalendarDays className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
          </button>
          <DatePicker
            value={session.date}
            onChange={handleDateChange}
            open={showDatePicker}
            onOpenChange={setShowDatePicker}
          />
        </div>
        {exercises.length > 0 && (
          <div className="mt-3 flex gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
              <Activity className="size-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">
                {exercises.length} exercice{exercises.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
              <Layers className="size-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">
                {totalSets} série{totalSets !== 1 ? "s" : ""}
              </span>
            </div>
            {totalVolume > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
                <Weight className="size-3.5 text-primary" />
                <span className="text-xs font-bold text-primary">
                  {Math.round(totalVolume)} kg
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exercises */}
      {exercises.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Dumbbell className="size-8 text-primary/50" />
          </div>
          <div>
            <p className="font-semibold">Aucun exercice</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Ajoute un exercice pour commencer
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {exercises.map((ex) => (
            <ExerciseBlock
              key={ex.sessionExerciseId}
              sessionExerciseId={ex.sessionExerciseId}
              exerciseId={ex.exerciseId}
              name={ex.name}
              muscleGroup={ex.muscleGroup}
              locked={ex.locked}
              record={ex.record}
              sets={ex.sets}
              onAddSet={handleAddSet}
              onDeleteSet={handleDeleteSet}
              onRemoveExercise={handleRemoveExercise}
              onToggleLock={handleToggleLock}
            />
          ))}
        </div>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-primary/10 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg gap-2">
          <Button
            variant="outline"
            className="flex-1 h-12 border-primary/30 text-base font-bold text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => setShowPicker(true)}
          >
            <Plus className="size-5" strokeWidth={3} />
            Exercice
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-12 w-12"
            onClick={handleDeleteSession}
          >
            <Trash2 className="size-5" />
          </Button>
        </div>
      </div>

      {/* Picker */}
      <ExercisePicker
        open={showPicker}
        onOpenChange={setShowPicker}
        onSelect={handleSelectExercise}
      />

    </div>
  );
}
