"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, PawPrint, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatureCard } from "@/components/creature-card";
import { RARITY_COLORS, RARITY_LABELS, type Rarity } from "@/lib/rarities";

type Category = "animal" | "pokemon";

interface CreatureBase {
  id: number;
  slug: string;
  name: string;
  rarity: Rarity;
  imageUrl: string | null;
  kind: Category;
}
interface AnimalCreature extends CreatureBase {
  kind: "animal";
  cardNumber: number | null;
  scientificName: string | null;
  description: string | null;
}
interface PokemonCreature extends CreatureBase {
  kind: "pokemon";
  pokedexNumber: number | null;
  primaryType: string | null;
  secondaryType: string | null;
}
type Creature = AnimalCreature | PokemonCreature;

export interface OpenResult {
  category: Category;
  rarity: Rarity;
  creature: Creature;
  isDuplicate: boolean;
  shardsGranted: number;
}

const CATEGORY_LABELS: Record<Category, string> = {
  animal: "Animal",
  pokemon: "Pokémon",
};

export function PackOpenModal({
  result,
  onClose,
}: {
  result: OpenResult;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<"sealed" | "burst" | "category" | "reveal">("sealed");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("burst"), 500);
    const t2 = setTimeout(() => setStage("category"), 1300);
    const t3 = setTimeout(() => setStage("reveal"), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const colors = RARITY_COLORS[result.rarity];
  const Icon = result.category === "animal" ? PawPrint : Zap;
  const categoryLabel = CATEGORY_LABELS[result.category];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-colors hover:text-primary"
      >
        <X className="size-5" />
      </button>

      <div className="flex w-full max-w-sm flex-col items-center gap-6 px-6">
        {stage === "sealed" && (
          <div className="flex size-64 items-center justify-center rounded-3xl bg-gradient-orange-intense text-black shadow-2xl glow-orange animate-pulse">
            <Sparkles className="size-24" strokeWidth={2.5} />
          </div>
        )}

        {stage === "burst" && (
          <div className="relative flex size-64 items-center justify-center">
            <div className={`absolute inset-0 rounded-3xl ${colors.bg} blur-2xl animate-ping`} />
            <div className={`relative size-64 rounded-3xl ${colors.bg} ring-4 ${colors.ring} animate-spin-slow`} />
          </div>
        )}

        {stage === "category" && (
          <div className="flex flex-col items-center gap-4 animate-card-reveal">
            <div className={`flex size-48 items-center justify-center rounded-3xl ${colors.bg} ring-4 ${colors.ring}`}>
              <Icon className={`size-24 ${colors.text}`} strokeWidth={2} />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                C'est un...
              </p>
              <p className={`mt-1 text-3xl font-black tracking-tighter ${colors.text}`}>
                {categoryLabel}
              </p>
            </div>
          </div>
        )}

        {stage === "reveal" && (
          <>
            <div className="w-72 animate-card-reveal">
              <CreatureCard
                name={result.creature.name}
                rarity={result.rarity}
                imageUrl={result.creature.imageUrl}
                number={
                  result.creature.kind === "animal"
                    ? result.creature.cardNumber
                    : result.creature.pokedexNumber
                }
                category={result.category}
                primaryType={result.creature.kind === "pokemon" ? result.creature.primaryType : undefined}
                secondaryType={result.creature.kind === "pokemon" ? result.creature.secondaryType : undefined}
                size="lg"
              />
            </div>

            <div className="text-center">
              <p className={`text-xs font-black uppercase tracking-widest ${colors.text}`}>
                {RARITY_LABELS[result.rarity]} · {categoryLabel}
              </p>
              {result.creature.kind === "animal" && result.creature.scientificName && (
                <p className="mt-1 text-xs italic text-muted-foreground">
                  {result.creature.scientificName}
                </p>
              )}
              {result.creature.kind === "animal" && result.creature.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {result.creature.description}
                </p>
              )}
              {result.isDuplicate && (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">
                    Doublon — +1 fragment {RARITY_LABELS[result.rarity].toLowerCase()} {categoryLabel.toLowerCase()}
                  </span>
                </div>
              )}
            </div>

            <Button
              onClick={onClose}
              className="h-12 w-full rounded-2xl bg-gradient-orange-intense text-base font-bold text-black"
            >
              Continuer
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
