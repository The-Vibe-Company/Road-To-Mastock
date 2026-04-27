"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SetForm } from "./set-form";
import { SetRow } from "./set-row";
import { RestTimer } from "./rest-timer";
import { Lock, Unlock, Trophy, ChevronUp, ChevronDown, StickyNote, Check, Trash2, History, Loader2 } from "lucide-react";

interface ExerciseSet {
  id: number;
  setNumber: number;
  weightKg: number;
  reps: number;
}

interface LastPerf {
  date: string;
  sets: { weightKg: number; reps: number }[];
}

interface ExerciseBlockProps {
  sessionExerciseId: number;
  exerciseId: number;
  name: string;
  muscleGroups: string[];
  locked: boolean;
  notes: string | null;
  record: number | null;
  lastPerf: LastPerf | null;
  knownWeights: number[];
  sets: ExerciseSet[];
  onAddSet: (sessionExerciseId: number, weightKg: number, reps: number) => void | Promise<void>;
  onDeleteSet: (setId: number) => void | Promise<void>;
  onRemoveExercise: (sessionExerciseId: number) => void | Promise<void>;
  onToggleLock: (sessionExerciseId: number, locked: boolean) => void;
  onUpdateNotes: (sessionExerciseId: number, notes: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const recordStyles: Record<number, { card: string; badge: string; label: string }> = {
  1: { card: "card-gradient-gold", badge: "bg-yellow-500/15 text-yellow-500", label: "Record" },
  2: { card: "card-gradient-silver", badge: "bg-gray-400/15 text-gray-400", label: "2e" },
  3: { card: "card-gradient-bronze", badge: "bg-amber-700/15 text-amber-700", label: "3e" },
};

export function ExerciseBlock({
  sessionExerciseId,
  exerciseId,
  name,
  muscleGroups,
  locked,
  notes,
  record,
  lastPerf,
  knownWeights,
  sets,
  onAddSet,
  onDeleteSet,
  onRemoveExercise,
  onToggleLock,
  onUpdateNotes,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: ExerciseBlockProps) {
  const lastSet = sets[sets.length - 1];
  const totalVolume = sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
  const medal = record && record <= 3 ? recordStyles[record] : null;
  const [showNotes, setShowNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState(notes || "");
  const [showTimer, setShowTimer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSetId, setDeleteSetId] = useState<number | null>(null);
  const [deletingSet, setDeletingSet] = useState(false);
  const [deletingExercise, setDeletingExercise] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const notesVisible = !!savedNotes || showNotes;

  const handleAddSet = async (w: number, r: number) => {
    await onAddSet(sessionExerciseId, w, r);
    setShowTimer(true);
  };

  const handleConfirmDeleteSet = async () => {
    if (deleteSetId === null || deletingSet) return;
    setDeletingSet(true);
    try {
      await onDeleteSet(deleteSetId);
      setDeleteSetId(null);
    } finally {
      setDeletingSet(false);
    }
  };

  const handleConfirmDeleteExercise = async () => {
    if (deletingExercise) return;
    setDeletingExercise(true);
    try {
      await onRemoveExercise(sessionExerciseId);
    } finally {
      setDeletingExercise(false);
    }
  };

  return (
    <Card className={`${medal ? medal.card : "card-gradient-border"} ${locked ? "opacity-70" : ""}`}>
      <CardHeader>
        <div>
          <Link href={`/exercises/${exerciseId}`} className="transition-colors hover:text-primary">
            <CardTitle className="text-base font-black tracking-tight">{name}</CardTitle>
          </Link>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {medal && (
              <Badge className={`${medal.badge} text-[10px] font-bold`}>
                <Trophy className="mr-1 size-3" />
                {medal.label}
              </Badge>
            )}
            {muscleGroups.map((mg) => (
              <Badge key={mg} variant="secondary" className="text-[10px] font-bold">{mg}</Badge>
            ))}
            {totalVolume > 0 && (
              <Badge variant="outline" className="border-primary/20 text-[10px] text-primary">
                {Math.round(totalVolume)} kg vol.
              </Badge>
            )}
            {locked && (
              <Badge variant="outline" className="border-muted-foreground/20 text-[10px] text-muted-foreground">
                Termine
              </Badge>
            )}
          </div>
        </div>
        <CardAction className="flex gap-1">
          {!locked && canMoveUp && (
            <button onClick={onMoveUp} className="flex size-10 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-colors active:scale-95 hover:text-primary">
              <ChevronUp className="size-5" />
            </button>
          )}
          {!locked && canMoveDown && (
            <button onClick={onMoveDown} className="flex size-10 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-colors active:scale-95 hover:text-primary">
              <ChevronDown className="size-5" />
            </button>
          )}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`flex size-10 items-center justify-center rounded-xl transition-colors active:scale-95 ${
              savedNotes ? "bg-primary/15 text-primary" : "bg-secondary/50 text-muted-foreground hover:text-primary"
            }`}
          >
            <StickyNote className="size-5" />
          </button>
          <button
            onClick={() => onToggleLock(sessionExerciseId, !locked)}
            className={`flex size-10 items-center justify-center rounded-xl transition-colors active:scale-95 ${
              locked ? "bg-primary/15 text-primary" : "bg-secondary/50 text-muted-foreground hover:text-primary"
            }`}
          >
            {locked ? <Lock className="size-5" /> : <Unlock className="size-5" />}
          </button>
          {!locked && (
            <button onClick={() => setShowDeleteConfirm(true)} className="flex size-10 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-colors active:scale-95 hover:text-red-500">
              <Trash2 className="size-5" />
            </button>
          )}
        </CardAction>
      </CardHeader>

      <CardContent>
        {/* Notes */}
        {notesVisible && (
          <div className="mb-3 flex gap-2">
            <textarea
              ref={notesRef}
              defaultValue={savedNotes}
              placeholder="Notes..."
              className="flex-1 resize-none rounded-lg bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              rows={2}
            />
            <Button
              variant="ghost"
              size="icon-xs"
              className="mt-1 shrink-0 text-muted-foreground hover:text-primary"
              onClick={() => {
                const val = notesRef.current?.value || "";
                onUpdateNotes(sessionExerciseId, val);
                setSavedNotes(val);
                if (!val) setShowNotes(false);
              }}
            >
              <Check className="size-4" />
            </Button>
          </div>
        )}

        {/* Last performance */}
        {!locked && lastPerf && lastPerf.sets.length > 0 && (
          <div className="mb-3 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2.5">
            <div className="mb-2 flex items-center gap-1.5">
              <History className="size-3 text-primary/40" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Derniere perf</span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {lastPerf.sets.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-4 text-right text-[10px] font-bold text-primary/30">{i + 1}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-primary/70">{s.weightKg}</span>
                    <span className="text-[10px] text-muted-foreground">kg</span>
                    <span className="text-xs text-primary/25">x</span>
                    <span className="text-sm font-black text-primary/70">{s.reps}</span>
                    <span className="text-[10px] text-muted-foreground">reps</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sets.length > 0 && (
          <div className={!locked ? "mb-3 border-b border-border/50 pb-2" : ""}>
            {sets.map((s) => (
              <SetRow
                key={s.id}
                setNumber={s.setNumber}
                weightKg={s.weightKg}
                reps={s.reps}
                onDelete={locked ? undefined : () => setDeleteSetId(s.id)}
              />
            ))}
          </div>
        )}

        {/* Delete set confirmation */}
        {deleteSetId !== null && (
          <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-3">
            <p className="mb-2.5 text-center text-sm font-bold">Supprimer cette serie ?</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10 border-primary/30 text-sm font-bold"
                onClick={() => setDeleteSetId(null)}
                disabled={deletingSet}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-10 text-sm font-bold"
                onClick={handleConfirmDeleteSet}
                disabled={deletingSet}
              >
                {deletingSet ? <Loader2 className="size-4 animate-spin" /> : "Supprimer"}
              </Button>
            </div>
          </div>
        )}

        {/* Rest timer */}
        {!locked && showTimer && (
          <div className="mb-3">
            <RestTimer onDismiss={() => setShowTimer(false)} />
          </div>
        )}

        {!locked && (
          <SetForm
            onAdd={handleAddSet}
            lastWeight={lastSet?.weightKg}
            lastReps={lastSet?.reps}
            knownWeights={knownWeights}
          />
        )}
      </CardContent>

      {/* Delete exercise confirmation */}
      {showDeleteConfirm && (
        <div className="border-t border-border/50 px-4 py-3">
          <p className="mb-3 text-center text-sm font-bold">
            Supprimer {name} ?
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-10 border-primary/30 text-sm font-bold"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deletingExercise}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-10 text-sm font-bold"
              onClick={handleConfirmDeleteExercise}
              disabled={deletingExercise}
            >
              {deletingExercise ? <Loader2 className="size-4 animate-spin" /> : "Supprimer"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
