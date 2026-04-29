"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { X, Sparkles, ChevronRight, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatureCard } from "@/components/creature-card";
import { SlotReveal, type SlotItem } from "@/components/slot-reveal";
import { AnimalEmblem } from "@/components/emblems/animal-emblem";
import { PokemonEmblem } from "@/components/emblems/pokemon-emblem";
import { RarityEmblem } from "@/components/emblems/rarity-emblem";
import { FUSION_NEXT, RARITIES, RARITY_COLORS, RARITY_LABELS, type Rarity } from "@/lib/rarities";
import { PACK_DESCRIPTIONS, PACK_LABELS, PACK_TYPES, type PackType } from "@/lib/pack-types";

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

// Halo color per pack type for the bare-image reveal
const PACK_HALO: Record<PackType, string> = {
  basic:        "bg-orange-500/30",
  animal_only:  "bg-emerald-500/35",
  pokemon_only: "bg-sky-500/35",
  premium:      "bg-amber-500/45",
  mythic:       "bg-rose-500/55",
};

const TIER_RING_BIG: Record<Rarity, string> = {
  common:    "ring-zinc-400/40",
  uncommon:  "ring-emerald-400/50",
  rare:      "ring-sky-400/60",
  epic:      "ring-violet-400/70",
  legendary: "ring-amber-400/80",
  mythic:    "ring-rose-400",
};
const TIER_BG_BIG: Record<Rarity, string> = {
  common:    "bg-zinc-500/20",
  uncommon:  "bg-emerald-500/20",
  rare:      "bg-sky-500/20",
  epic:      "bg-violet-500/20",
  legendary: "bg-amber-500/20",
  mythic:    "bg-rose-500/25",
};
const TIER_GLOW_BIG: Record<Rarity, string> = {
  common:    "",
  uncommon:  "shadow-[0_0_50px_-10px_rgba(52,211,153,0.5)]",
  rare:      "shadow-[0_0_60px_-8px_rgba(56,189,248,0.7)]",
  epic:      "shadow-[0_0_70px_-6px_rgba(167,139,250,0.8)]",
  legendary: "shadow-[0_0_90px_-4px_rgba(251,191,36,0.85)]",
  mythic:    "shadow-[0_0_110px_-2px_rgba(244,114,182,0.95)]",
};

// ─── Pack tile: just the image with a colored halo, no frame ──────────────
function PackTile({ packType }: { packType: PackType }) {
  const isHolo = packType === "premium" || packType === "mythic";
  return (
    <div className="relative h-72 w-52">
      <div className={`absolute inset-0 -m-6 rounded-full ${PACK_HALO[packType]} blur-3xl`} />
      <Image
        src={`/cards/packs/${packType}.png`}
        alt={PACK_LABELS[packType]}
        fill
        unoptimized
        className="relative object-contain drop-shadow-[0_8px_28px_rgba(0,0,0,0.7)]"
      />
      {isHolo && (
        <div className="pointer-events-none absolute inset-0 holo-shimmer rounded-2xl" />
      )}
    </div>
  );
}

const PACK_ITEMS: SlotItem[] = PACK_TYPES.map((t) => ({
  key: t,
  render: () => <PackTile packType={t} />,
}));

const CATEGORY_ITEMS: SlotItem[] = [
  { key: "animal",  render: () => <AnimalEmblem /> },
  { key: "pokemon", render: () => <PokemonEmblem /> },
];

const RARITY_ITEMS: SlotItem[] = RARITIES.map((r) => ({
  key: r,
  render: () => <RarityEmblem rarity={r} />,
}));

export function PackOpenModal({
  result,
  onClose,
}: {
  result: OpenResult;
  onClose: () => void;
}) {
  // Forced packs (animal_only / pokemon_only) skip the category stage.
  const skipCategory = result.packType === "animal_only" || result.packType === "pokemon_only";

  const stageOrder = useMemo<Stage[]>(
    () => (skipCategory ? ["pack", "rarity", "creature"] : ["pack", "category", "rarity", "creature"]),
    [skipCategory],
  );

  const [stage, setStage] = useState<Stage>("pack");
  const [settled, setSettled] = useState(false);

  const colors = RARITY_COLORS[result.rarity];
  const categoryLabel = CATEGORY_LABELS[result.category];
  const isHolo = result.rarity === "legendary" || result.rarity === "mythic";
  const nextRarity = FUSION_NEXT[result.rarity];

  const advance = () => {
    if (stage === "creature" || stage === "duplicate") return;
    const idx = stageOrder.indexOf(stage);
    const next = stageOrder[idx + 1];
    if (next) {
      setSettled(false);
      setStage(next);
    }
  };

  const handleBackdropClick = () => {
    if (!settled) return;
    if (stage === "creature" || stage === "duplicate") return;
    advance();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex select-none items-center justify-center overflow-y-auto bg-black/85 backdrop-blur-sm"
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

      <div className="flex w-full max-w-sm flex-col items-center gap-6 px-6 py-12">
        {/* STAGE 0 — Pack type */}
        {stage === "pack" && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              Tu reçois
            </p>
            <SlotReveal
              items={PACK_ITEMS}
              targetKey={result.packType}
              onSettle={() => setSettled(true)}
            />
            <div className="text-center min-h-[5rem]">
              {settled && (
                <div className="animate-card-reveal">
                  <p className="text-3xl font-black tracking-tighter">
                    {PACK_LABELS[result.packType]}
                  </p>
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                    {PACK_DESCRIPTIONS[result.packType]}
                  </p>
                </div>
              )}
            </div>
            {settled && <TapHint />}
          </>
        )}

        {/* STAGE 1 — Category (skipped for forced-category packs) */}
        {stage === "category" && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              C'est un...
            </p>
            <SlotReveal
              items={CATEGORY_ITEMS}
              targetKey={result.category}
              onSettle={() => setSettled(true)}
            />
            <div className="text-center min-h-[3rem]">
              {settled && (
                <p className="text-5xl font-black tracking-tighter text-primary animate-card-reveal">
                  {categoryLabel}
                </p>
              )}
            </div>
            {settled && <TapHint />}
          </>
        )}

        {/* STAGE 2 — Rarity */}
        {stage === "rarity" && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              Rareté
            </p>
            <SlotReveal
              items={RARITY_ITEMS}
              targetKey={result.rarity}
              onSettle={() => setSettled(true)}
            />
            <div className="text-center min-h-[3rem]">
              {settled && (
                <p className={`text-5xl font-black tracking-tighter ${colors.text} animate-card-reveal`}>
                  {RARITY_LABELS[result.rarity]}
                </p>
              )}
            </div>
            {settled && <TapHint />}
          </>
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

        {/* STAGE 4 — Duplicate reward */}
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
                className={`relative flex size-24 items-center justify-center rounded-2xl ring-2 ${TIER_RING_BIG[result.rarity]} ${TIER_BG_BIG[result.rarity]} ${TIER_GLOW_BIG[result.rarity]}`}
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
