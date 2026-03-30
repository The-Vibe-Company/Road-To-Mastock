"use client";

import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SetForm } from "./set-form";
import { SetRow } from "./set-row";
import { X } from "lucide-react";

interface ExerciseSet {
  id: number;
  setNumber: number;
  weightKg: number;
  reps: number;
}

interface ExerciseBlockProps {
  sessionExerciseId: number;
  name: string;
  muscleGroup: string | null;
  sets: ExerciseSet[];
  onAddSet: (sessionExerciseId: number, weightKg: number, reps: number) => void;
  onDeleteSet: (setId: number) => void;
  onRemoveExercise: (sessionExerciseId: number) => void;
}

export function ExerciseBlock({
  sessionExerciseId,
  name,
  muscleGroup,
  sets,
  onAddSet,
  onDeleteSet,
  onRemoveExercise,
}: ExerciseBlockProps) {
  const lastSet = sets[sets.length - 1];
  const totalVolume = sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);

  return (
    <Card className="border-l-2 border-l-primary/50 card-glow">
      <CardHeader>
        <div>
          <CardTitle className="text-base font-black tracking-tight">{name}</CardTitle>
          <div className="mt-2 flex gap-1.5">
            {muscleGroup && (
              <Badge variant="secondary" className="text-[10px] font-bold">{muscleGroup}</Badge>
            )}
            {totalVolume > 0 && (
              <Badge variant="outline" className="border-primary/20 text-[10px] text-primary">
                {Math.round(totalVolume)} kg vol.
              </Badge>
            )}
          </div>
        </div>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onRemoveExercise(sessionExerciseId)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {sets.length > 0 && (
          <div className="mb-3 border-b border-border/50 pb-2">
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
      </CardContent>
    </Card>
  );
}
