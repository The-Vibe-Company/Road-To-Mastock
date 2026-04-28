"use client";

import { useState } from "react";
import { X, Sparkles, PawPrint, Zap, Crown, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatureCard } from "@/components/creature-card";
import { RARITY_COLORS, RARITY_LABELS, type Rarity } from "@/lib/rarities";

type Category = "animal" | "pokemon";
type Stage = "category" | "rarity" | "creature";

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

const RARITY_ICON: Record<Rarity, typeof Star> = {
  common: Star,
  uncommon: Star,
  rare: Star,
  epic: Sparkles,
  legendary: Crown,
  mythic: Crown,
};

const RARITY_GLOW: Record<Rarity, string> = {
  common:    "shadow-[0_0_60px_-10px_rgba(161,161,170,0.5)]",
  uncommon:  "shadow-[0_0_60px_-10px_rgba(52,211,153,0.6)]",
  rare:      "shadow-[0_0_70px_-8px_rgba(56,189,248,0.7)]",
  epic:      "shadow-[0_0_80px_-6px_rgba(167,139,250,0.8)]",
  legendary: "shadow-[0_0_100px_-4px_rgba(251,191,36,0.85)]",
  mythic:    "shadow-[0_0_120px_-2px_rgba(244,114,182,0.95)]",
};

export function PackOpenModal({
  result,
  onClose,
}: {
  result: OpenResult;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<Stage>("category");
  const colors = RARITY_COLORS[result.rarity];
  const CategoryIcon = result.category === "animal" ? PawPrint : Zap;
  const RarityIcon = RARITY_ICON[result.rarity];
  const categoryLabel = CATEGORY_LABELS[result.category];
  const isHolo = result.rarity === "legendary" || result.rarity === "mythic";

  const advance = () => {
    if (stage === "category") setStage("rarity");
    else if (stage === "rarity") setStage("creature");
  };

  // Click anywhere except the close button advances the stage
  const handleBackdropClick = () => {
    if (stage === "category" || stage === "rarity") advance();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex select-none items-center justify-center bg-black/85 backdrop-blur-sm"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Fermer"
        className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-xl bg-secondary/60 text-muted-foreground backdrop-blur transition-colors hover:text-primary"
      >
        <X className="size-5" />
      </button>

      <div className="flex w-full max-w-sm flex-col items-center gap-6 px-6">
        {/* STAGE 1 — Category */}
        {stage === "category" && (
          <div key="category" className="flex flex-col items-center gap-6 animate-card-reveal">
            <div className="relative flex size-56 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/15 blur-3xl animate-pulse" />
              <div className="relative flex size-56 items-center justify-center rounded-full bg-gradient-orange-intense shadow-2xl glow-orange">
                <CategoryIcon className="size-28 text-black" strokeWidth={2.2} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                C'est un...
              </p>
              <p className="mt-2 text-5xl font-black tracking-tighter text-primary">
                {categoryLabel}
              </p>
            </div>
            <TapHint />
          </div>
        )}

        {/* STAGE 2 — Rarity */}
        {stage === "rarity" && (
          <div key="rarity" className="flex flex-col items-center gap-6 animate-card-reveal">
            <div className="relative flex size-56 items-center justify-center">
              {isHolo && (
                <div className="pointer-events-none absolute inset-0 rounded-full holo-shimmer" />
              )}
              <div className={`absolute inset-0 rounded-full ${colors.bg} blur-3xl animate-pulse`} />
              <div
                className={`relative flex size-56 items-center justify-center rounded-full ring-4 ${colors.ring} ${colors.bg} ${RARITY_GLOW[result.rarity]}`}
              >
                <RarityIcon className={`size-28 ${colors.text}`} strokeWidth={2.2} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Rareté
              </p>
              <p className={`mt-2 text-5xl font-black tracking-tighter ${colors.text}`}>
                {RARITY_LABELS[result.rarity]}
              </p>
            </div>
            <TapHint />
          </div>
        )}

        {/* STAGE 3 — Creature reveal */}
        {stage === "creature" && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full flex-col items-center gap-5"
          >
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
              {result.isDuplicate && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
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
          </div>
        )}
      </div>
    </div>
  );
}

function TapHint() {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/80 animate-pulse">
      <span>Tape pour continuer</span>
      <ChevronRight className="size-3" />
    </div>
  );
}
