"use client";

import { useState } from "react";

interface SetFormProps {
  onAdd: (weightKg: number, reps: number) => void;
  lastWeight?: number;
  lastReps?: number;
}

export function SetForm({ onAdd, lastWeight, lastReps }: SetFormProps) {
  const [weight, setWeight] = useState(lastWeight?.toString() || "");
  const [reps, setReps] = useState(lastReps?.toString() || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (isNaN(w) || isNaN(r) || w < 0 || r <= 0) return;
    onAdd(w, r);
    // Keep values for next set (common pattern in gym tracking)
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="flex-1">
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          placeholder="kg"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-center text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <span className="text-zinc-400">x</span>
      <div className="flex-1">
        <input
          type="number"
          inputMode="numeric"
          min="1"
          placeholder="reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-center text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white active:bg-primary-dark"
      >
        +
      </button>
    </form>
  );
}
