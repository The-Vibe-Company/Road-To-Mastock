"use client";

import { useEffect, useState } from "react";
import { Lock, Flame, Gift, PawPrint, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { PackOpenModal, type OpenResult } from "@/components/pack-open-modal";
import { CreatureCard } from "@/components/creature-card";
import { CardDetailModal, type DetailedCreature } from "@/components/card-detail-modal";
import {
  RARITIES,
  RARITY_COLORS,
  RARITY_LABELS,
  FUSION_COST,
  FUSION_NEXT,
  type Rarity,
} from "@/lib/rarities";

type Category = "animal" | "pokemon";

interface AnimalCard {
  id: number;
  count: number;
  firstObtainedAt: string;
  slug: string;
  name: string;
  rarity: Rarity;
  cardNumber: number | null;
  scientificName: string | null;
  imageUrl: string | null;
  description: string | null;
  flavor: string | null;
  heightCm: number | null;
  weightKg: number | null;
  habitat: string | null;
}

interface PokemonCard {
  id: number;
  count: number;
  firstObtainedAt: string;
  slug: string;
  name: string;
  rarity: Rarity;
  pokedexNumber: number | null;
  primaryType: string | null;
  secondaryType: string | null;
  imageUrl: string | null;
  flavor: string | null;
  heightCm: number | null;
  weightKg: number | null;
  habitat: string | null;
}

interface CollectionData {
  animals: {
    cards: AnimalCard[];
    totalsByRarity: Record<Rarity, number>;
    shards: Record<Rarity, number>;
  };
  pokemon: {
    cards: PokemonCard[];
    totalsByRarity: Record<Rarity, number>;
    shards: Record<Rarity, number>;
  };
  tokens: number;
}

export default function CollectionPage() {
  const [data, setData] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("animal");
  const [activeRarity, setActiveRarity] = useState<Rarity>("common");
  const [opening, setOpening] = useState(false);
  const [fusing, setFusing] = useState<Rarity | null>(null);
  const [modalResult, setModalResult] = useState<OpenResult | null>(null);
  const [detailCreature, setDetailCreature] = useState<DetailedCreature | null>(null);

  const refresh = async () => {
    const r = await fetch("/api/cards");
    if (r.ok) setData(await r.json());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleOpenPack = async () => {
    if (opening || !data || data.tokens < 1) return;
    setOpening(true);
    try {
      const r = await fetch("/api/cards/open", { method: "POST" });
      if (!r.ok) return;
      setModalResult(await r.json());
      await refresh();
    } finally {
      setOpening(false);
    }
  };

  const handleFuse = async (rarity: Rarity) => {
    if (fusing) return;
    setFusing(rarity);
    try {
      const r = await fetch("/api/cards/fusion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromRarity: rarity, category: activeCategory }),
      });
      if (!r.ok) return;
      setModalResult(await r.json());
      await refresh();
    } finally {
      setFusing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!data) return null;

  const section = activeCategory === "animal" ? data.animals : data.pokemon;
  const cardsByRarity: Record<Rarity, (AnimalCard | PokemonCard)[]> = {
    common: [], uncommon: [], rare: [], epic: [], legendary: [], mythic: [],
  };
  for (const c of section.cards) cardsByRarity[c.rarity].push(c);

  const tabCards = cardsByRarity[activeRarity];
  const tabTotal = section.totalsByRarity[activeRarity] || 0;
  const tabOwned = tabCards.length;
  const tabShards = section.shards[activeRarity] || 0;
  const canFuse = FUSION_NEXT[activeRarity] !== null && tabShards >= FUSION_COST;

  const totalUnique = section.cards.length;
  const totalAll = Object.values(section.totalsByRarity).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-dvh px-4 pb-12 pt-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Collection</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalUnique} {activeCategory === "animal" ? "animaux" : "pokémon"} uniques sur {totalAll}
        </p>
      </div>

      {/* Token opener */}
      <div className={`mb-6 rounded-2xl px-4 py-4 ring-1 ${data.tokens > 0 ? "bg-primary/10 ring-primary/40 glow-orange" : "bg-secondary/30 ring-border"}`}>
        <div className="flex items-center gap-3">
          <div className={`flex size-12 items-center justify-center rounded-xl ${data.tokens > 0 ? "bg-gradient-orange-intense text-black" : "bg-secondary text-muted-foreground"}`}>
            <Gift className="size-6" strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Jetons
            </p>
            <p className="text-xl font-black tracking-tight">{data.tokens}</p>
          </div>
          <Button
            onClick={handleOpenPack}
            disabled={data.tokens < 1 || opening}
            className="h-11 bg-gradient-orange-intense px-4 font-bold text-black disabled:opacity-50"
          >
            {opening ? "Ouverture..." : "Ouvrir un pack"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {data.tokens === 0
            ? "Termine une séance pour gagner un jeton."
            : "75% animal · 25% pokémon"}
        </p>
      </div>

      {/* Category tabs */}
      <div className="mb-4 flex gap-1.5 rounded-2xl bg-secondary/30 p-1">
        <button
          onClick={() => setActiveCategory("animal")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95 ${
            activeCategory === "animal"
              ? "bg-gradient-orange-intense text-black shadow-lg"
              : "text-muted-foreground hover:bg-accent"
          }`}
        >
          <PawPrint className="size-4" />
          <span>Animaux</span>
          <span className="tabular-nums text-[10px] opacity-70 min-w-[3.5rem] text-left">
            {data.animals.cards.length}/{Object.values(data.animals.totalsByRarity).reduce((a, b) => a + b, 0)}
          </span>
        </button>
        <button
          onClick={() => setActiveCategory("pokemon")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95 ${
            activeCategory === "pokemon"
              ? "bg-gradient-orange-intense text-black shadow-lg"
              : "text-muted-foreground hover:bg-accent"
          }`}
        >
          <Zap className="size-4" />
          <span>Pokémon</span>
          <span className="tabular-nums text-[10px] opacity-70 min-w-[3.5rem] text-left">
            {data.pokemon.cards.length}/{Object.values(data.pokemon.totalsByRarity).reduce((a, b) => a + b, 0)}
          </span>
        </button>
      </div>

      {/* Rarity tabs */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-2">
        {RARITIES.map((r) => {
          const colors = RARITY_COLORS[r];
          const owned = cardsByRarity[r].length;
          const total = section.totalsByRarity[r] || 0;
          const isActive = activeRarity === r;
          return (
            <button
              key={r}
              onClick={() => setActiveRarity(r)}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
                isActive
                  ? `${colors.bg} ${colors.text} ring-1 ${colors.ring}`
                  : "bg-secondary/50 text-muted-foreground hover:bg-accent"
              }`}
            >
              {RARITY_LABELS[r]}
              <span className="ml-1.5 tabular-nums opacity-70 inline-block min-w-[2.75rem] text-left">
                {owned}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Fusion bar */}
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-secondary/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <Flame className={`size-4 ${RARITY_COLORS[activeRarity].text}`} />
          <span className="text-sm font-bold">
            {tabShards} fragment{tabShards !== 1 ? "s" : ""} {RARITY_LABELS[activeRarity].toLowerCase()}
          </span>
        </div>
        {FUSION_NEXT[activeRarity] && (
          <Button
            size="sm"
            disabled={!canFuse || fusing !== null}
            onClick={() => handleFuse(activeRarity)}
            className="h-8 bg-gradient-orange-intense px-3 text-xs font-bold text-black disabled:opacity-50"
          >
            {fusing === activeRarity
              ? "Fusion..."
              : `Fusionner ${FUSION_COST} → 1 ${RARITY_LABELS[FUSION_NEXT[activeRarity]!].toLowerCase()}`}
          </Button>
        )}
      </div>

      {tabOwned === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Lock className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Aucun {activeCategory === "animal" ? "animal" : "pokémon"} {RARITY_LABELS[activeRarity].toLowerCase()} pour le moment
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {tabCards.map((c) => {
            const isPokemon = activeCategory === "pokemon";
            const number = isPokemon
              ? (c as PokemonCard).pokedexNumber
              : (c as AnimalCard).cardNumber;
            return (
              <button
                key={c.id}
                onClick={() => {
                  if (isPokemon) {
                    const p = c as PokemonCard;
                    setDetailCreature({
                      kind: "pokemon",
                      id: p.id,
                      slug: p.slug,
                      name: p.name,
                      rarity: p.rarity,
                      imageUrl: p.imageUrl,
                      count: p.count,
                      flavor: p.flavor,
                      heightCm: p.heightCm,
                      weightKg: p.weightKg,
                      habitat: p.habitat,
                      pokedexNumber: p.pokedexNumber,
                      primaryType: p.primaryType,
                      secondaryType: p.secondaryType,
                    });
                  } else {
                    const a = c as AnimalCard;
                    setDetailCreature({
                      kind: "animal",
                      id: a.id,
                      slug: a.slug,
                      name: a.name,
                      rarity: a.rarity,
                      imageUrl: a.imageUrl,
                      count: a.count,
                      flavor: a.flavor,
                      heightCm: a.heightCm,
                      weightKg: a.weightKg,
                      habitat: a.habitat,
                      cardNumber: a.cardNumber,
                      scientificName: a.scientificName,
                      description: a.description,
                    });
                  }
                }}
                className="block w-full transition-transform active:scale-95"
              >
                <CreatureCard
                  name={c.name}
                  rarity={c.rarity}
                  imageUrl={c.imageUrl}
                  number={number}
                  category={activeCategory}
                  primaryType={isPokemon ? (c as PokemonCard).primaryType : undefined}
                  secondaryType={isPokemon ? (c as PokemonCard).secondaryType : undefined}
                  count={c.count}
                  size="sm"
                />
              </button>
            );
          })}
        </div>
      )}

      {modalResult && (
        <PackOpenModal result={modalResult} onClose={() => setModalResult(null)} />
      )}

      {detailCreature && (
        <CardDetailModal
          creature={detailCreature}
          onClose={() => setDetailCreature(null)}
        />
      )}
    </div>
  );
}
