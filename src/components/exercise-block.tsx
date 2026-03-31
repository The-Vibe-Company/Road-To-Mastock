"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SetForm } from "./set-form";
import { SetRow } from "./set-row";
import { RestTimer } from "./rest-timer";
import { X, Lock, Unlock, Trophy, ChevronUp, ChevronDown, StickyNote } from "lucide-react";

interface ExerciseSet {
  id: number;
  setNumber: number;
  weightKg: number;
  reps: number;
}

interface ExerciseBlockProps {
  sessionExerciseId: number;
  exerciseId: number;
  name: string;
  muscleGroup: string | null;
  locked: boolean;
  notes: string | null;
  record: number | null;
  sets: ExerciseSet[];
  onAddSet: (sessionExerciseId: number, weightKg: number, reps: number) => void;
  onDeleteSet: (setId: number) => void;
  onRemoveExercise: (sessionExerciseId: number) => void;
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
  muscleGroup,
  locked,
  notes,
  record,
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
  const [showNotes, setShowNotes] = useState(!!notes);
  const [showTimer, setShowTimer] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const handleAddSet = (w: number, r: number) => {
    onAddSet(sessionExerciseId, w, r);
    setShowTimer(true);
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
            {muscleGroup && (
              <Badge variant="secondary" className="text-[10px] font-bold">{muscleGroup}</Badge>
            )}
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
        <CardAction className="flex gap-0.5">
          {!locked && (
            <>
              {canMoveUp && (
                <Button variant="ghost" size="icon-xs" onClick={onMoveUp} className="text-muted-foreground hover:text-primary">
                  <ChevronUp className="size-4" />
                </Button>
              )}
              {canMoveDown && (
                <Button variant="ghost" size="icon-xs" onClick={onMoveDown} className="text-muted-foreground hover:text-primary">
                  <ChevronDown className="size-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowNotes(!showNotes)}
                className={notes ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-primary"}
              >
                <StickyNote className="size-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onToggleLock(sessionExerciseId, !locked)}
            className={locked ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-primary"}
          >
            {locked ? <Lock className="size-4" /> : <Unlock className="size-4" />}
          </Button>
          {!locked && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onRemoveExercise(sessionExerciseId)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="size-4" />
            </Button>
          )}
        </CardAction>
      </CardHeader>

      <CardContent>
        {/* Notes */}
        {showNotes && (
          <div className="mb-3">
            {locked ? (
              notes && <p className="text-xs italic text-muted-foreground">{notes}</p>
            ) : (
              <textarea
                ref={notesRef}
                defaultValue={notes || ""}
                placeholder="Notes..."
                onBlur={(e) => onUpdateNotes(sessionExerciseId, e.target.value)}
                className="w-full resize-none rounded-lg bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                rows={2}
              />
            )}
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
                onDelete={locked ? undefined : () => onDeleteSet(s.id)}
              />
            ))}
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
          />
        )}
      </CardContent>
    </Card>
  );
}
