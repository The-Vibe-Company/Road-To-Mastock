"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface SetRowProps {
  setNumber: number;
  weightKg: number;
  reps: number;
  onDelete?: () => void;
}

export function SetRow({ setNumber, weightKg, reps, onDelete }: SetRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
          {setNumber}
        </span>
        <span className="text-base font-black">{weightKg} kg</span>
        <span className="text-sm font-bold text-primary/40">x</span>
        <span className="text-base font-semibold">{reps}</span>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDelete}
          className="text-muted-foreground/50 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
