"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RARITY_COLORS, RARITY_LABELS, type Rarity } from "@/lib/rarities";

interface AnimalCard {
  id: number;
  slug: string;
  name: string;
  rarity: Rarity;
  scientificName: string | null;
  imageUrl: string | null;
  description: string | null;
}

interface OpenResponse {
  animal: AnimalCard;
  isDuplicate: boolean;
  shardsGranted: number;
  rarity: Rarity;
}

export function PackOpenModal({
  result,
  onClose,
}: {
  result: OpenResponse;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<"sealed" | "burst" | "reveal">("sealed");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("burst"), 500);
    const t2 = setTimeout(() => setStage("reveal"), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const colors = RARITY_COLORS[result.rarity];

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

        {stage === "reveal" && (
          <>
            <div
              className={`flex size-64 flex-col items-center justify-center gap-2 rounded-3xl ring-4 ${colors.bg} ${colors.ring} shadow-2xl animate-card-reveal`}
            >
              {result.animal.imageUrl ? (
                <Image
                  src={result.animal.imageUrl}
                  alt={result.animal.name}
                  width={140}
                  height={140}
                  className={`size-36 object-contain ${colors.text}`}
                  unoptimized
                />
              ) : (
                <div className={`flex size-36 items-center justify-center rounded-2xl ${colors.bg}`}>
                  <Sparkles className={`size-16 ${colors.text}`} />
                </div>
              )}
              <p className={`text-[10px] font-black uppercase tracking-widest ${colors.text}`}>
                {RARITY_LABELS[result.rarity]}
              </p>
            </div>

            <div className="text-center">
              <p className={`text-2xl font-black tracking-tight ${colors.text}`}>
                {result.animal.name}
              </p>
              {result.animal.scientificName && (
                <p className="mt-1 text-xs italic text-muted-foreground">
                  {result.animal.scientificName}
                </p>
              )}
              {result.animal.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {result.animal.description}
                </p>
              )}
              {result.isDuplicate && (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">
                    Doublon — +1 fragment {RARITY_LABELS[result.rarity].toLowerCase()}
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
