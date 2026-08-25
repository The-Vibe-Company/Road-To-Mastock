"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

interface SetFormProps {
  onAdd: (weightKg: number, reps: number) => void | Promise<void>;
  lastWeight?: number;
  lastReps?: number;
  knownWeights?: number[];
  /** Poids prévu par le programme du jour pour cette série. Prioritaire sur la
   *  simple montée d'un palier. */
  plannedWeight?: number;
  /** Change à chaque appui sur « Appliquer » pour réimposer le poids prévu,
   *  même si l'utilisateur avait saisi autre chose. */
  applyToken?: number;
}

function getNextWeight(currentWeight: number | undefined, knownWeights: number[]): number | undefined {
  if (!currentWeight || knownWeights.length === 0) return undefined;
  const sorted = [...knownWeights].sort((a, b) => a - b);
  const next = sorted.find((w) => w > currentWeight);
  return next ?? currentWeight;
}

export function SetForm({
  onAdd,
  lastWeight,
  lastReps,
  knownWeights = [],
  plannedWeight,
  applyToken,
}: SetFormProps) {
  const suggestedWeight =
    plannedWeight ??
    (lastWeight != null
      ? getNextWeight(lastWeight, knownWeights) ?? lastWeight
      : undefined);

  const [weight, setWeight] = useState(suggestedWeight?.toString() || "");
  const [reps, setReps] = useState(lastReps?.toString() || "10");
  const [submitting, setSubmitting] = useState(false);
  // Dès que l'utilisateur touche au champ, on cesse d'y écrire : le parent se
  // re-rend à chaque rafraîchissement de la séance (y compris déclenché par un
  // AUTRE exercice), et sans ce garde-fou sa saisie serait effacée.
  const [edited, setEdited] = useState(false);
  // Lu dans les effets sans en être une dépendance : le tableau change
  // d'identité à chaque rafraîchissement alors que son contenu est stable.
  const knownWeightsRef = useRef(knownWeights);
  knownWeightsRef.current = knownWeights;

  const suggestFor = (last: number | undefined) =>
    plannedWeight ??
    (last != null
      ? getNextWeight(last, knownWeightsRef.current) ?? last
      : undefined);

  // Une série vient d'être enregistrée : on repart d'une saisie propre.
  useEffect(() => {
    const next = suggestFor(lastWeight);
    if (next != null) setWeight(next.toString());
    setReps("10");
    setEdited(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastWeight, lastReps]);

  // Le programme a été recalculé : on ne l'impose que si le champ est intact.
  useEffect(() => {
    if (edited || plannedWeight == null) return;
    setWeight(plannedWeight.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plannedWeight]);

  // « Appliquer » : on réimpose le poids prévu, sans toucher aux reps saisies.
  useEffect(() => {
    if (applyToken == null || plannedWeight == null) return;
    setWeight(plannedWeight.toString());
    setEdited(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (isNaN(w) || isNaN(r) || w < 0 || r <= 0) return;
    setSubmitting(true);
    try {
      await onAdd(w, r);
    } finally {
      setSubmitting(false);
    }
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
          onChange={(e) => {
            setWeight(e.target.value);
            setEdited(true);
          }}
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
        disabled={submitting}
        className="h-11 w-11 shrink-0 rounded-xl bg-gradient-orange-intense text-black shadow-lg disabled:opacity-100"
      >
        {submitting ? (
          <Loader2 className="size-5 animate-spin" strokeWidth={3} />
        ) : (
          <Check className="size-5" strokeWidth={3} />
        )}
      </Button>
    </form>
  );
}
