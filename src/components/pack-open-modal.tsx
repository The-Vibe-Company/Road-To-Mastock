"use client";

import { useState } from "react";
import { X, Sparkles, PawPrint, Zap, Crown, Star, ChevronRight, Gem, Package, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatureCard } from "@/components/creature-card";
import { FUSION_NEXT, RARITY_COLORS, RARITY_LABELS, type Rarity } from "@/lib/rarities";
import { PACK_LABELS, type PackType } from "@/lib/pack-types";

type Category = "animal" | "pokemon";
type Stage = "pack" | "category" | "rarity" | "creature" | "duplicate";

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
  packType: PackType;
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

const PACK_ACCENT: Record<PackType, { ring: string; bg: string; text: string; glow: string; icon: typeof Package }> = {
  basic:        { ring: "ring-zinc-400/60",  bg: "bg-zinc-500/15",  text: "text-zinc-200",  glow: "shadow-[0_0_60px_-10px_rgba(161,161,170,0.5)]", icon: Package },
  animal_only:  { ring: "ring-emerald-400/60", bg: "bg-emerald-500/15", text: "text-emerald-200", glow: "shadow-[0_0_70px_-8px_rgba(52,211,153,0.7)]", icon: PawPrint },
  pokemon_only: { ring: "ring-sky-400/60",   bg: "bg-sky-500/15",   text: "text-sky-200",   glow: "shadow-[0_0_70px_-8px_rgba(56,189,248,0.7)]", icon: Zap },
  premium:      { ring: "ring-amber-400/70", bg: "bg-amber-500/15", text: "text-amber-200", glow: "shadow-[0_0_90px_-6px_rgba(251,191,36,0.85)]", icon: Gift },
  mythic:       { ring: "ring-rose-400/80",  bg: "bg-rose-500/20",  text: "text-rose-200",  glow: "shadow-[0_0_120px_-2px_rgba(244,114,182,0.95)]", icon: Crown },
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
  const [stage, setStage] = useState<Stage>("pack");
  const colors = RARITY_COLORS[result.rarity];
  const CategoryIcon = result.category === "animal" ? PawPrint : Zap;
  const RarityIcon = RARITY_ICON[result.rarity];
  const categoryLabel = CATEGORY_LABELS[result.category];
  const isHolo = result.rarity === "legendary" || result.rarity === "mythic";
  const packAccent = PACK_ACCENT[result.packType];
  const PackIcon = packAccent.icon;
  const isPremiumPack = result.packType === "premium" || result.packType === "mythic";

  const advance = () => {
    if (stage === "pack") setStage("category");
    else if (stage === "category") setStage("rarity");
    else if (stage === "rarity") setStage("creature");
  };

  const handleBackdropClick = () => {
    if (stage === "pack" || stage === "category" || stage === "rarity") advance();
  };

  const nextRarity = FUSION_NEXT[result.rarity];

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
        {/* STAGE 0 — Pack type reveal */}
        {stage === "pack" && (
          <div key="pack" className="flex flex-col items-center gap-6 animate-card-reveal">
            <div className="relative flex size-56 items-center justify-center">
              {isPremiumPack && (
                <div className="pointer-events-none absolute inset-0 rounded-full holo-shimmer" />
              )}
              <div className={`absolute inset-0 rounded-full ${packAccent.bg} blur-3xl animate-pulse`} />
              <div
                className={`relative flex size-56 items-center justify-center rounded-full ring-4 ${packAccent.ring} ${packAccent.bg} ${packAccent.glow}`}
              >
                <PackIcon className={`size-28 ${packAccent.text}`} strokeWidth={2} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Tu reçois
              </p>
              <p className={`mt-2 text-4xl font-black tracking-tighter ${packAccent.text}`}>
                {PACK_LABELS[result.packType]}
              </p>
            </div>
            <TapHint />
          </div>
        )}

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
                <p className="mt-2 text-xs text-muted-foreground">
                  Tu possèdes déjà cette carte
                </p>
              )}
            </div>

            <Button
              onClick={() => (result.isDuplicate ? setStage("duplicate") : onClose())}
              className="h-12 w-full rounded-2xl bg-gradient-orange-intense text-base font-bold text-black"
            >
              {result.isDuplicate ? "Voir ma récompense" : "Continuer"}
            </Button>
          </div>
        )}

        {/* STAGE 4 — Duplicate fragment reward */}
        {stage === "duplicate" && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full flex-col items-center gap-6 animate-card-reveal"
          >
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Doublon
              </p>
              <p className="mt-2 text-2xl font-black tracking-tight">
                Cette carte se transforme
              </p>
            </div>

            {/* Transformation viz: card → ✨ → fragment */}
            <div className="flex items-center gap-3">
              <div className="w-24 opacity-50 grayscale">
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
                  size="sm"
                />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <ChevronRight className={`size-6 ${colors.text}`} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  devient
                </span>
              </div>
              <div
                className={`relative flex size-24 items-center justify-center rounded-2xl ring-2 ${colors.ring} ${colors.bg} ${RARITY_GLOW[result.rarity]}`}
              >
                {isHolo && (
                  <div className="pointer-events-none absolute inset-0 rounded-2xl holo-shimmer" />
                )}
                <Gem className={`size-12 ${colors.text}`} strokeWidth={1.5} />
              </div>
            </div>

            <div className="text-center">
              <p className={`text-3xl font-black tracking-tighter ${colors.text}`}>
                +1 fragment
              </p>
              <p className={`mt-1 text-xs font-black uppercase tracking-widest ${colors.text}`}>
                {RARITY_LABELS[result.rarity]} · {categoryLabel}
              </p>
              {nextRarity && (
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  Combine <span className="font-mono tabular-nums">3</span> fragments {RARITY_LABELS[result.rarity].toLowerCase()}{" "}
                  pour fusionner en une carte{" "}
                  <span className={`font-bold ${RARITY_COLORS[nextRarity].text}`}>
                    {RARITY_LABELS[nextRarity].toLowerCase()}
                  </span>
                </p>
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
