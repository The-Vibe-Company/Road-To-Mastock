"use client";

import { X, Ruler, Weight, MapPin } from "lucide-react";
import { CreatureCard } from "@/components/creature-card";
import { RARITY_COLORS, RARITY_LABELS, type Rarity } from "@/lib/rarities";

type Category = "animal" | "pokemon";

export interface DetailedCreature {
  kind: Category;
  id: number;
  slug: string;
  name: string;
  rarity: Rarity;
  imageUrl: string | null;
  count?: number;
  // shared enrichment
  flavor: string | null;
  heightCm: number | null;
  weightKg: number | null;
  habitat: string | null;
  // animal-specific
  cardNumber?: number | null;
  scientificName?: string | null;
  description?: string | null;
  // pokemon-specific
  pokedexNumber?: number | null;
  primaryType?: string | null;
  secondaryType?: string | null;
}

function formatHeight(cm: number | null): string | null {
  if (cm == null) return null;
  if (cm >= 100) return `${(cm / 100).toFixed(1).replace(".0", "")} m`;
  return `${Math.round(cm)} cm`;
}

function formatWeight(kg: number | null): string | null {
  if (kg == null) return null;
  if (kg >= 1) return `${kg.toFixed(1).replace(".0", "")} kg`;
  return `${Math.round(kg * 1000)} g`;
}

export function CardDetailModal({
  creature,
  onClose,
}: {
  creature: DetailedCreature;
  onClose: () => void;
}) {
  const colors = RARITY_COLORS[creature.rarity];
  const number =
    creature.kind === "animal" ? creature.cardNumber ?? null : creature.pokedexNumber ?? null;
  // Show pokémon types as subtitle; no scientific name for animals.
  const subtitle =
    creature.kind === "pokemon"
      ? [creature.primaryType, creature.secondaryType].filter(Boolean).join(" · ")
      : null;
  const flavorText = creature.flavor ?? creature.description ?? null;
  const height = formatHeight(creature.heightCm);
  const weight = formatWeight(creature.weightKg);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/85 backdrop-blur-sm">
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="fixed right-4 top-4 z-10 flex size-10 items-center justify-center rounded-xl bg-secondary/80 text-muted-foreground backdrop-blur transition-colors hover:text-primary"
      >
        <X className="size-5" />
      </button>

      <div className="flex w-full max-w-md flex-col items-center gap-5 px-5 py-10">
        <div className="w-[18rem] sm:w-80">
          <CreatureCard
            name={creature.name}
            rarity={creature.rarity}
            imageUrl={creature.imageUrl}
            number={number}
            category={creature.kind}
            primaryType={creature.primaryType}
            secondaryType={creature.secondaryType}
            count={creature.count}
            size="lg"
          />
        </div>

        <div className="text-center">
          <p className={`text-[10px] font-black uppercase tracking-widest ${colors.text}`}>
            {RARITY_LABELS[creature.rarity]} · {creature.kind === "animal" ? "Animal" : "Pokémon"}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">{creature.name}</h2>
          {subtitle && (
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {(height || weight || creature.habitat) && (
          <div className="w-full space-y-2">
            {(height || weight) && (
              <div className={`flex items-center justify-around gap-2 rounded-xl ${colors.bg} ring-1 ${colors.ring} px-3 py-3`}>
                {height && (
                  <div className="flex items-center gap-2">
                    <Ruler className={`size-4 ${colors.text}`} />
                    <div className="text-left">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
                        Taille
                      </p>
                      <p className={`mt-0.5 text-sm font-black ${colors.text} leading-none`}>{height}</p>
                    </div>
                  </div>
                )}
                {height && weight && <div className="h-7 w-px bg-border/60" />}
                {weight && (
                  <div className="flex items-center gap-2">
                    <Weight className={`size-4 ${colors.text}`} />
                    <div className="text-left">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
                        Poids
                      </p>
                      <p className={`mt-0.5 text-sm font-black ${colors.text} leading-none`}>{weight}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {creature.habitat && (
              <div className={`flex items-center gap-3 rounded-xl ${colors.bg} ring-1 ${colors.ring} px-4 py-3`}>
                <MapPin className={`size-4 shrink-0 ${colors.text}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
                    Milieu
                  </p>
                  <p className={`mt-1 text-sm font-black ${colors.text}`}>{creature.habitat}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {flavorText ? (
          <div className="w-full rounded-2xl bg-secondary/30 px-4 py-3 text-sm leading-relaxed text-foreground/90">
            {flavorText}
          </div>
        ) : (
          <div className="w-full rounded-2xl bg-secondary/30 px-4 py-3 text-center text-xs italic text-muted-foreground">
            Aucune description disponible pour le moment.
          </div>
        )}

        {creature.count && creature.count > 1 && (
          <p className="text-xs font-bold text-muted-foreground">
            Possédé ×{creature.count}
          </p>
        )}
      </div>
    </div>
  );
}
