"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface SetFormProps {
  onAdd: (weightKg: number, reps: number) => void;
  lastWeight?: number;
  lastReps?: number;
  knownWeights?: number[];
}

function getNextWeight(currentWeight: number | undefined, knownWeights: number[]): number | undefined {
  if (!currentWeight || knownWeights.length === 0) return undefined;
  const sorted = [...knownWeights].sort((a, b) => a - b);
  const next = sorted.find((w) => w > currentWeight);
  return next ?? currentWeight;
}

export function SetForm({ onAdd, lastWeight, lastReps, knownWeights = [] }: SetFormProps) {
  const suggestedWeight = lastWeight != null
    ? getNextWeight(lastWeight, knownWeights) ?? lastWeight
    : undefined;

  const [weight, setWeight] = useState(suggestedWeight?.toString() || "");
  const [reps, setReps] = useState(lastReps?.toString() || "10");

  // Update suggestions when lastWeight/lastReps change (new set added)
  useEffect(() => {
    if (lastWeight != null) {
      const next = getNextWeight(lastWeight, knownWeights) ?? lastWeight;
      setWeight(next.toString());
    }
    setReps("10");
  }, [lastWeight, lastReps, knownWeights]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (isNaN(w) || isNaN(r) || w < 0 || r <= 0) return;
    onAdd(w, r);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Input
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          placeholder="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="h-11 bg-secondary/50 pr-8 text-center text-base font-bold"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
          kg
        </span>
      </div>
      <span className="text-lg font-black text-primary/40">x</span>
      <div className="relative flex-1">
        <Input
          type="number"
          inputMode="numeric"
          min="1"
          placeholder="0"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="h-11 bg-secondary/50 pr-10 text-center text-base font-bold"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
          reps
        </span>
      </div>
      <Button
        type="submit"
        size="icon"
        className="h-11 w-11 shrink-0 rounded-xl bg-gradient-orange-intense text-black shadow-lg"
      >
        <Check className="size-5" strokeWidth={3} />
      </Button>
    </form>
  );
}
