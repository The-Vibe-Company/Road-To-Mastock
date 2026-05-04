"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { type CardioMachine, cardioFields } from "@/lib/cardio";

export interface CardioPayload {
  durationMinutes: number;
  calories: number | null;
  distanceKm: number | null;
  avgSpeedKmh: number | null;
  resistanceLevel: number | null;
}

interface CardioSetFormProps {
  machine: CardioMachine;
  onAdd: (payload: CardioPayload) => void | Promise<void>;
  lastDuration?: number | null;
  lastResistance?: number | null;
}

function toNum(v: string): number | null {
  const n = parseFloat(v);
  return isFinite(n) && n >= 0 ? n : null;
}

export function CardioSetForm({ machine, onAdd, lastDuration, lastResistance }: CardioSetFormProps) {
  const fields = cardioFields[machine];
  const [duration, setDuration] = useState(lastDuration?.toString() ?? "");
  const [calories, setCalories] = useState("");
  const [distance, setDistance] = useState("");
  const [avgSpeed, setAvgSpeed] = useState("");
  const [resistance, setResistance] = useState(lastResistance?.toString() ?? "");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setDuration("");
    setCalories("");
    setDistance("");
    setAvgSpeed("");
    setResistance("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const dur = toNum(duration);
    if (dur === null || dur <= 0) return;
    setSubmitting(true);
    try {
      await onAdd({
        durationMinutes: Math.round(dur),
        calories: toNum(calories),
        distanceKm: fields.distance ? toNum(distance) : null,
        avgSpeedKmh: fields.avgSpeed ? toNum(avgSpeed) : null,
        resistanceLevel: fields.resistance ? (toNum(resistance) !== null ? Math.round(toNum(resistance)!) : null) : null,
      });
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <Input
            type="number"
            inputMode="numeric"
            min="1"
            placeholder="Durée"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="h-11 bg-secondary/50 pr-10 text-center text-base font-bold"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
            min
          </span>
        </div>
        <div className="relative">
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Cal."
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="h-11 bg-secondary/50 pr-10 text-center text-base font-bold"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
            kcal
          </span>
        </div>
      </div>

      {(fields.distance || fields.avgSpeed || fields.resistance) && (
        <div className="grid grid-cols-2 gap-2">
          {fields.distance && (
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="Distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="h-11 bg-secondary/50 pr-10 text-center text-base font-bold"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                km
              </span>
            </div>
          )}
          {fields.avgSpeed && (
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="Vitesse moy."
                value={avgSpeed}
                onChange={(e) => setAvgSpeed(e.target.value)}
                className="h-11 bg-secondary/50 pr-12 text-center text-base font-bold"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                km/h
              </span>
            </div>
          )}
          {fields.resistance && (
            <div className="relative">
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                max="20"
                placeholder="Résistance"
                value={resistance}
                onChange={(e) => setResistance(e.target.value)}
                className="h-11 bg-secondary/50 pr-12 text-center text-base font-bold"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                niv.
              </span>
            </div>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting || !duration}
        className="h-11 w-full bg-gradient-orange-intense font-bold text-black shadow-lg disabled:opacity-100"
      >
        {submitting ? (
          <Loader2 className="size-5 animate-spin" strokeWidth={3} />
        ) : (
          <>
            <Check className="size-5" strokeWidth={3} />
            Enregistrer
          </>
        )}
      </Button>
    </form>
  );
}
