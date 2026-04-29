"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { X, Sparkles, PawPrint, Zap, Crown, Star, ChevronRight, Gem, Package, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatureCard } from "@/components/creature-card";
import { SlotReveal, type SlotItem } from "@/components/slot-reveal";
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

const RARITY_ICON: Record<Rarity, typeof Star> = {
  common: Star,
  uncommon: Star,
  rare: Star,
  epic: Sparkles,
  legendary: Crown,
  mythic: Crown,
};

const PACK_FALLBACK_ICON: Record<PackType, typeof Package> = {
  basic: Package,
  animal_only: PawPrint,
  pokemon_only: Zap,
  premium: Gift,
  mythic: Crown,
};

const PACK_TINT: Record<PackType, string> = {
  basic:        "from-zinc-700 via-zinc-900 to-black",
  animal_only:  "from-emerald-700 via-emerald-950 to-black",
  pokemon_only: "from-sky-700 via-sky-950 to-black",
  premium:      "from-amber-600 via-amber-900 to-black",
  mythic:       "from-rose-600 via-fuchsia-900 to-black",
};

const PACK_RING: Record<PackType, string> = {
  basic:        "ring-zinc-400/40",
  animal_only:  "ring-emerald-400/60",
  pokemon_only: "ring-sky-400/60",
  premium:      "ring-amber-400/70",
  mythic:       "ring-rose-400/80",
};

const PACK_GLOW: Record<PackType, string> = {
  basic:        "",
  animal_only:  "shadow-[0_0_50px_-10px_rgba(52,211,153,0.6)]",
  pokemon_only: "shadow-[0_0_50px_-10px_rgba(56,189,248,0.6)]",
  premium:      "shadow-[0_0_70px_-8px_rgba(251,191,36,0.7)]",
  mythic:       "shadow-[0_0_90px_-4px_rgba(244,114,182,0.85)]",
};

const TIER_BIG_BG: Record<Rarity, string> = {
  common:    "bg-zinc-500/20",
  uncommon:  "bg-emerald-500/20",
  rare:      "bg-sky-500/20",
  epic:      "bg-violet-500/20",
  legendary: "bg-amber-500/20",
  mythic:    "bg-rose-500/25",
};

const TIER_BIG_RING: Record<Rarity, string> = {
  common:    "ring-zinc-400/40",
  uncommon:  "ring-emerald-400/50",
  rare:      "ring-sky-400/60",
  epic:      "ring-violet-400/70",
  legendary: "ring-amber-400/80",
  mythic:    "ring-rose-400",
};

const TIER_BIG_GLOW: Record<Rarity, string> = {
  common:    "",
  uncommon:  "shadow-[0_0_50px_-10px_rgba(52,211,153,0.5)]",
  rare:      "shadow-[0_0_60px_-8px_rgba(56,189,248,0.7)]",
  epic:      "shadow-[0_0_70px_-6px_rgba(167,139,250,0.8)]",
  legendary: "shadow-[0_0_90px_-4px_rgba(251,191,36,0.85)]",
  mythic:    "shadow-[0_0_110px_-2px_rgba(244,114,182,0.95)]",
};

// ─── Pack art tile (used inside SlotReveal items) ────────────────────────
function PackTile({ packType }: { packType: PackType }) {
  const FallbackIcon = PACK_FALLBACK_ICON[packType];
  const isHolo = packType === "premium" || packType === "mythic";
  const [errored, setErrored] = useState(false);
  return (
    <div
      className={`relative h-72 w-52 overflow-hidden rounded-3xl border-2 bg-gradient-to-b ${PACK_TINT[packType]} ring-2 ${PACK_RING[packType]} ${PACK_GLOW[packType]} border-white/5`}
    >
      {!errored ? (
        <Image
          src={`/cards/packs/${packType}.png`}
          alt={PACK_LABELS[packType]}
          fill
          unoptimized
          className="object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <FallbackIcon className="size-24 text-white/80" strokeWidth={1.5} />
        </div>
      )}
      {isHolo && (
        <div className="pointer-events-none absolute inset-0 holo-shimmer" />
      )}
      <div className="pointer-events-none absolute right-0 top-0 size-16 bg-gradient-to-bl from-white/20 via-transparent to-transparent" />
    </div>
  );
}

// ─── Category badge tile ─────────────────────────────────────────────────
function CategoryTile({ category }: { category: Category }) {
  const Icon = category === "animal" ? PawPrint : Zap;
  const tint = category === "animal" ? "bg-emerald-500/15 ring-emerald-400/60" : "bg-sky-500/15 ring-sky-400/60";
  const text = category === "animal" ? "text-emerald-200" : "text-sky-200";
  return (
    <div className={`relative flex size-56 items-center justify-center rounded-full ring-4 ${tint}`}>
      <div className="absolute inset-0 rounded-full bg-current opacity-5 blur-3xl" />
      <Icon className={`size-28 ${text}`} strokeWidth={2} />
    </div>
  );
}

// ─── Rarity badge tile ───────────────────────────────────────────────────
function RarityTile({ rarity }: { rarity: Rarity }) {
  const Icon = RARITY_ICON[rarity];
  const colors = RARITY_COLORS[rarity];
  const isHolo = rarity === "legendary" || rarity === "mythic";
  return (
    <div
      className={`relative flex size-56 items-center justify-center rounded-full ring-4 ${TIER_BIG_RING[rarity]} ${TIER_BIG_BG[rarity]} ${TIER_BIG_GLOW[rarity]}`}
    >
      {isHolo && (
        <div className="pointer-events-none absolute inset-0 rounded-full holo-shimmer" />
      )}
      <Icon className={`size-28 ${colors.text}`} strokeWidth={2} />
    </div>
  );
}

const PACK_ITEMS: SlotItem[] = PACK_TYPES.map((t) => ({
  key: t,
  render: () => <PackTile packType={t} />,
}));

const CATEGORY_ITEMS: SlotItem[] = [
  { key: "animal",  render: () => <CategoryTile category="animal" /> },
  { key: "pokemon", render: () => <CategoryTile category="pokemon" /> },
];

const RARITY_ITEMS: SlotItem[] = RARITIES.map((r) => ({
  key: r,
  render: () => <RarityTile rarity={r} />,
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
        {/* STAGE 0 — Pack type slot reveal */}
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

        {/* STAGE 1 — Category slot reveal (skipped for animal_only / pokemon_only) */}
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

        {/* STAGE 2 — Rarity slot reveal */}
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
                className={`relative flex size-24 items-center justify-center rounded-2xl ring-2 ${TIER_BIG_RING[result.rarity]} ${TIER_BIG_BG[result.rarity]} ${TIER_BIG_GLOW[result.rarity]}`}
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

