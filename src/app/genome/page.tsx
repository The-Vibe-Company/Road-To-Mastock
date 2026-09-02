"use client";

import { useEffect, useState } from "react";
import { PawPrint, Zap } from "@/components/icons";
import { BackButton } from "@/components/back-button";
import { CreatureCard } from "@/components/creature-card";
import { Spinner } from "@/components/spinner";
import { RARITIES, RARITY_LABELS, type Rarity } from "@/lib/rarities";

// Le Génome (Mew) : l'index intégral du catalogue. Les cartes possédées en
// couleur, les autres en silhouette — on sait ce qui existe, pas où le
// trouver.

interface IndexCard {
  id: number;
  name: string;
  rarity: Rarity;
  imageUrl: string | null;
  number: number | null;
  owned: boolean;
}

type Category = "animal" | "pokemon";

const TIER_TEXT: Record<Rarity, string> = {
  common: "text-zinc-300",
  uncommon: "text-emerald-300",
  rare: "text-sky-300",
  epic: "text-violet-300",
  legendary: "text-amber-300",
  mythic: "text-rose-300",
};

export default function GenomePage() {
  const [data, setData] = useState<{ animals: IndexCard[]; pokemon: IndexCard[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [category, setCategory] = useState<Category>("animal");

  useEffect(() => {
    fetch("/api/genome")
      .then((r) => {
        if (r.status === 403) {
          setForbidden(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (forbidden || !data) {
    return (
      <div className="min-h-dvh px-4 pt-6">
        <BackButton fallback="/collection" />
        <p className="py-24 text-center text-sm text-muted-foreground">
          Seul le Génome ouvre cet index.
        </p>
      </div>
    );
  }

  const cards = category === "animal" ? data.animals : data.pokemon;
  const ownedCount = cards.filter((c) => c.owned).length;

  return (
    <div className="min-h-dvh px-4 pb-12 pt-6">
      <BackButton fallback="/collection" />

      <header className="mb-6 mt-3">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">
          Index
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tighter">Le Génome</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tout ce qui existe. <span className="font-mono tabular-nums text-primary">{ownedCount}</span>
          <span className="text-muted-foreground"> / {cards.length} dans ta collection.</span>
        </p>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-secondary/30 p-1">
        {(["animal", "pokemon"] as Category[]).map((cat) => {
          const Icon = cat === "animal" ? PawPrint : Zap;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition-colors ${
                category === cat
                  ? "bg-gradient-orange-intense text-black shadow-lg"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              <Icon className="size-4" strokeWidth={2.5} />
              {cat === "animal" ? "Animaux" : "Pokémon"}
            </button>
          );
        })}
      </div>

      <div className="space-y-7">
        {[...RARITIES].reverse().map((r) => {
          const group = cards.filter((c) => c.rarity === r);
          if (group.length === 0) return null;
          return (
            <section key={r}>
              <div className="mb-3 flex items-center gap-3">
                <h3 className={`text-[11px] font-black uppercase tracking-[0.25em] ${TIER_TEXT[r]}`}>
                  {RARITY_LABELS[r]}
                </h3>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {group.filter((c) => c.owned).length}/{group.length}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {group.map((c) => (
                  <div key={c.id} className={c.owned ? "" : "opacity-35 grayscale"}>
                    <CreatureCard
                      name={c.owned ? c.name : "???"}
                      rarity={c.rarity}
                      imageUrl={c.imageUrl}
                      number={c.number}
                      category={category}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
