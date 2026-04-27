"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Sparkles, Lock, Flame, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { PackOpenModal } from "@/components/pack-open-modal";
import {
  RARITIES,
  RARITY_COLORS,
  RARITY_LABELS,
  FUSION_COST,
  FUSION_NEXT,
  type Rarity,
} from "@/lib/rarities";

interface OwnedCard {
  animalId: number;
  count: number;
  firstObtainedAt: string;
  slug: string;
  name: string;
  rarity: Rarity;
  scientificName: string | null;
  imageUrl: string | null;
  description: string | null;
}

interface CollectionData {
  cards: OwnedCard[];
  totalsByRarity: Record<Rarity, number>;
  shards: Record<Rarity, number>;
  tokens: number;
}

interface OpenResult {
  animal: {
    id: number;
    slug: string;
    name: string;
    rarity: Rarity;
    scientificName: string | null;
    imageUrl: string | null;
    description: string | null;
  };
  isDuplicate: boolean;
  shardsGranted: number;
  rarity: Rarity;
}

export default function CollectionPage() {
  const [data, setData] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRarity, setActiveRarity] = useState<Rarity>("common");
  const [opening, setOpening] = useState(false);
  const [fusing, setFusing] = useState<Rarity | null>(null);
  const [modalResult, setModalResult] = useState<OpenResult | null>(null);

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
        body: JSON.stringify({ fromRarity: rarity }),
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

  const cardsByRarity: Record<Rarity, OwnedCard[]> = {
    common: [],
    uncommon: [],
    rare: [],
    epic: [],
    legendary: [],
    mythic: [],
  };
  for (const c of data.cards) cardsByRarity[c.rarity].push(c);

  const tabCards = cardsByRarity[activeRarity];
  const tabTotal = data.totalsByRarity[activeRarity] || 0;
  const tabOwned = tabCards.length;
  const tabShards = data.shards[activeRarity] || 0;
  const canFuse = FUSION_NEXT[activeRarity] !== null && tabShards >= FUSION_COST;
  const totalUnique = data.cards.length;
  const totalAll = Object.values(data.totalsByRarity).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-dvh px-4 pb-12 pt-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Collection</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalUnique} animaux uniques sur {totalAll}
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
            <p className="text-xl font-black tracking-tight">
              {data.tokens}
            </p>
          </div>
          <Button
            onClick={handleOpenPack}
            disabled={data.tokens < 1 || opening}
            className="h-11 bg-gradient-orange-intense px-4 font-bold text-black disabled:opacity-50"
          >
            {opening ? "Ouverture..." : "Ouvrir un pack"}
          </Button>
        </div>
        {data.tokens === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Termine une séance pour gagner un jeton.
          </p>
        )}
      </div>

      {/* Rarity tabs */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-2">
        {RARITIES.map((r) => {
          const colors = RARITY_COLORS[r];
          const owned = cardsByRarity[r].length;
          const total = data.totalsByRarity[r] || 0;
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
              <span className="ml-1.5 opacity-70">{owned}/{total}</span>
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
            Aucun animal {RARITY_LABELS[activeRarity].toLowerCase()} pour le moment
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {tabCards.map((c) => {
            const colors = RARITY_COLORS[c.rarity];
            return (
              <div
                key={c.animalId}
                className={`relative aspect-[3/4] rounded-xl ring-1 ${colors.bg} ${colors.ring} flex flex-col items-center justify-center gap-1 p-2`}
              >
                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    alt={c.name}
                    width={80}
                    height={80}
                    className={`size-16 object-contain ${colors.text}`}
                    unoptimized
                  />
                ) : (
                  <Sparkles className={`size-10 ${colors.text}`} />
                )}
                <p className={`mt-1 line-clamp-2 px-1 text-center text-[10px] font-bold leading-tight ${colors.text}`}>
                  {c.name}
                </p>
                {c.count > 1 && (
                  <span className="absolute right-1.5 top-1.5 rounded-md bg-black/40 px-1.5 py-0.5 text-[9px] font-black text-white">
                    ×{c.count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalResult && (
        <PackOpenModal result={modalResult} onClose={() => setModalResult(null)} />
      )}
    </div>
  );
}
