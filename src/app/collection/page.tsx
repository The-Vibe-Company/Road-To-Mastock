"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, PawPrint, Zap, Vault, Star, Package } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { PackOpenModal, type OpenResult } from "@/components/pack-open-modal";
import { CreatureCard } from "@/components/creature-card";
import { CardDetailModal, type DetailedCreature } from "@/components/card-detail-modal";
import { SpinWheelModal } from "@/components/spin-wheel-modal";
import {
  RARITIES,
  RARITY_LABELS,
  FUSION_COST,
  FUSION_NEXT,
  CONVERSION_BATCH,
  CONVERSION_RATE,
  type Rarity,
} from "@/lib/rarities";
import { PACK_TYPE_WEIGHTS, type PackType } from "@/lib/pack-types";
import { useTalents } from "@/components/talents-provider";
import { ThroneBackdrop } from "@/components/throne-backdrop";
import { Spinner } from "@/components/spinner";

type Category = "animal" | "pokemon";
type Filter = "all" | Rarity;

const TIER_DOT: Record<Rarity, string> = {
  common:    "bg-zinc-400",
  uncommon:  "bg-emerald-400",
  rare:      "bg-sky-400",
  epic:      "bg-violet-400",
  legendary: "bg-amber-400",
  mythic:    "bg-rose-400",
};

const TIER_TEXT: Record<Rarity, string> = {
  common:    "text-zinc-300",
  uncommon:  "text-emerald-300",
  rare:      "text-sky-300",
  epic:      "text-violet-300",
  legendary: "text-amber-300",
  mythic:    "text-rose-300",
};

const TIER_FILL: Record<Rarity, string> = {
  common:    "bg-zinc-500/15 ring-zinc-500/40",
  uncommon:  "bg-emerald-500/15 ring-emerald-500/40",
  rare:      "bg-sky-500/15 ring-sky-500/40",
  epic:      "bg-violet-500/15 ring-violet-500/50",
  legendary: "bg-amber-500/15 ring-amber-500/60",
  mythic:    "bg-rose-500/15 ring-rose-500/70",
};

interface AnimalCard {
  id: number;
  count: number;
  firstObtainedAt: string;
  slug: string;
  name: string;
  nickname: string | null;
  rarity: Rarity;
  lineage: string | null;
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
  nickname: string | null;
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
  animals: { cards: AnimalCard[]; totalsByRarity: Record<Rarity, number>; shards: Record<Rarity, number> };
  pokemon: { cards: PokemonCard[]; totalsByRarity: Record<Rarity, number>; shards: Record<Rarity, number> };
  tokens: number;
  specialTokens: number;
  charges?: Record<string, number>;
  odds?: {
    hat: Record<PackType, number>;
    innerPokemon: number;
    innerShift?: number;
    wheel: Record<string, number>;
  };
}

function StableCount({ owned, total }: { owned: number; total: number }) {
  return (
    <span className="font-mono text-[10px] tabular-nums">
      <span className="inline-block w-6 text-right">{owned}</span>
      <span className="opacity-50">/</span>
      <span className="inline-block w-6 text-left">{total}</span>
    </span>
  );
}

export default function CollectionPage() {
  const [data, setData] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("animal");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [opening, setOpening] = useState(false);
  const [fusing, setFusing] = useState<Rarity | null>(null);
  const [converting, setConverting] = useState<Rarity | null>(null);
  // La Roue de la Forge : tirage en cours, puis le fragment gagné.
  const [forging, setForging] = useState(false);
  const [forgeWin, setForgeWin] = useState<{ rarity: Rarity; category: Category } | null>(null);
  const [modalResult, setModalResult] = useState<OpenResult | null>(null);
  const [detailCreature, setDetailCreature] = useState<DetailedCreature | null>(null);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const { has } = useTalents();
  // L'Inclassable (Ornithorynque) : des tris merveilleux et inutiles.
  const [sortMode, setSortMode] = useState<"rarity" | "name" | "height" | "weight" | "habitat">("rarity");

  const refresh = async () => {
    try {
      // Timeout de 8 s : une requête gelée pendant une transition iOS ne
      // doit jamais verrouiller la page sur son spinner.
      const r = await fetch("/api/cards", {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) setData(await r.json());
    } catch {
      // réseau : on retentera au prochain passage
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // Retour depuis une autre page : les effets ne se relancent pas sur une
    // restauration bfcache (persisted), et un history load complet peut
    // resservir le HTML-spinner — on recharge dans les deux cas.
    const onShow = () => refresh();
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleForgeWheel = async () => {
    if (forging) return;
    setForging(true);
    try {
      const r = await fetch("/api/cards/forge", { method: "POST" });
      if (!r.ok) return;
      const win = await r.json();
      setForgeWin({ rarity: win.rarity, category: win.category });
      await refresh();
    } finally {
      setForging(false);
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

  const handleConvert = async (rarity: Rarity) => {
    if (converting) return;
    setConverting(rarity);
    try {
      const r = await fetch("/api/cards/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rarity, category: activeCategory }),
      });
      if (!r.ok) return;
      await refresh();
    } finally {
      setConverting(null);
    }
  };

  const openDetail = (c: AnimalCard | PokemonCard) => {
    if (activeCategory === "pokemon") {
      const p = c as PokemonCard;
      setDetailCreature({
        kind: "pokemon", id: p.id, slug: p.slug, name: p.name, nickname: p.nickname, rarity: p.rarity,
        imageUrl: p.imageUrl, count: p.count, flavor: p.flavor,
        heightCm: p.heightCm, weightKg: p.weightKg, habitat: p.habitat,
        pokedexNumber: p.pokedexNumber, primaryType: p.primaryType, secondaryType: p.secondaryType,
      });
    } else {
      const a = c as AnimalCard;
      setDetailCreature({
        kind: "animal", id: a.id, slug: a.slug, name: a.name, nickname: a.nickname, rarity: a.rarity,
        imageUrl: a.imageUrl, count: a.count, flavor: a.flavor,
        heightCm: a.heightCm, weightKg: a.weightKg, habitat: a.habitat,
        cardNumber: a.cardNumber, scientificName: a.scientificName, description: a.description,
        lineage: a.lineage,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          La Collection ne répond pas. Vérifie ta connexion, puis réessaie.
        </p>
        <button
          onClick={() => {
            setLoading(true);
            void refresh();
          }}
          className="rounded-xl bg-secondary/60 px-4 py-2.5 text-sm font-bold text-primary ring-1 ring-border"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const section = activeCategory === "animal" ? data.animals : data.pokemon;
  const cardsByRarity: Record<Rarity, (AnimalCard | PokemonCard)[]> = {
    common: [], uncommon: [], rare: [], epic: [], legendary: [], mythic: [],
  };
  for (const c of section.cards) cardsByRarity[c.rarity].push(c);

  const totalUnique = section.cards.length;
  const totalAll = Object.values(section.totalsByRarity).reduce((a, b) => a + b, 0);
  const fusionRarity = activeFilter !== "all" ? activeFilter : null;
  const fusionShards = fusionRarity ? (section.shards[fusionRarity] || 0) : 0;
  const canFuse = fusionRarity ? FUSION_NEXT[fusionRarity] !== null && fusionShards >= FUSION_COST : false;

  // Tri par défaut : le numéro de carte, comme un vrai classeur.
  // L'Inclassable (talent) ajoute ses tris absurdes par-dessus.
  const numberOf = (c: AnimalCard | PokemonCard) =>
    activeCategory === "pokemon"
      ? (c as PokemonCard).pokedexNumber ?? Number.MAX_SAFE_INTEGER
      : (c as AnimalCard).cardNumber ?? Number.MAX_SAFE_INTEGER;
  const sortCards = (cards: (AnimalCard | PokemonCard)[]) => {
    const sorted = [...cards];
    if (sortMode === "rarity") sorted.sort((a, b) => numberOf(a) - numberOf(b));
    if (sortMode === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sortMode === "height") sorted.sort((a, b) => (b.heightCm ?? 0) - (a.heightCm ?? 0));
    if (sortMode === "weight") sorted.sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0));
    if (sortMode === "habitat")
      sorted.sort((a, b) => (a.habitat ?? "zzz").localeCompare(b.habitat ?? "zzz"));
    return sorted;
  };

  const renderGrid = (cards: (AnimalCard | PokemonCard)[]) => (
    <div className="grid grid-cols-3 gap-2.5">
      {sortCards(cards).map((c) => {
        const isPokemon = activeCategory === "pokemon";
        const number = isPokemon
          ? (c as PokemonCard).pokedexNumber
          : (c as AnimalCard).cardNumber;
        return (
          <button
            key={c.id}
            onClick={() => openDetail(c)}
            className="group block w-full transition-all duration-150 hover:-translate-y-1 active:scale-95"
          >
            <CreatureCard
              name={c.nickname || c.name}
              rarity={c.rarity}
              imageUrl={c.imageUrl}
              number={number}
              category={activeCategory}
              primaryType={isPokemon ? (c as PokemonCard).primaryType : undefined}
              secondaryType={isPokemon ? (c as PokemonCard).secondaryType : undefined}
              count={c.count}
              size="sm"
              serti={has("sertissage")}
              className="group-hover:shadow-2xl"
            />
          </button>
        );
      })}
    </div>
  );

  const tabCards = activeFilter === "all" ? section.cards : cardsByRarity[activeFilter];

  return (
    <div className="relative min-h-dvh px-4 pb-12 pt-6">
      <ThroneBackdrop page="collection" />
      <BackButton />

      <header className="mb-6 mt-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">
            Vault
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tighter">Collection</h1>
        </div>
        <div className="mb-1 flex gap-1.5">
          <Link
            href="/oracle"
            className="inline-flex items-center rounded-xl bg-secondary/40 px-3 py-2 text-xs font-bold text-muted-foreground ring-1 ring-border transition-colors hover:text-primary"
          >
            Oracle
          </Link>
          {has("genome") && (
            <Link
              href="/genome"
              className="inline-flex items-center rounded-xl bg-secondary/40 px-3 py-2 text-xs font-bold text-muted-foreground ring-1 ring-border transition-colors hover:text-primary"
            >
              Génome
            </Link>
          )}
          <Link
            href="/grimoire"
            className="inline-flex items-center rounded-xl bg-secondary/40 px-3 py-2 text-xs font-bold text-muted-foreground ring-1 ring-border transition-colors hover:text-primary"
          >
            Grimoire
          </Link>
          <Link
            href="/manuel"
            className="inline-flex items-center rounded-xl bg-secondary/40 px-3 py-2 text-xs font-bold text-muted-foreground ring-1 ring-border transition-colors hover:text-primary"
          >
            ?
          </Link>
        </div>
      </header>

      {/* Hero panel */}
      <div className="card-gradient-border relative mb-6 overflow-hidden rounded-3xl">
        <div className="relative flex items-stretch gap-4 px-5 pb-4 pt-5">
          <div className="flex flex-col justify-center">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">
              Jetons
            </p>
            <p className="font-mono text-[3.5rem] font-black leading-none tracking-tighter tabular-nums text-primary">
              {data.tokens.toString().padStart(2, "0")}
            </p>
          </div>
          <div className="my-1 w-px bg-border" />
          <div className="flex flex-1 flex-col justify-center">
            <p className="text-xs font-black tracking-tight">
              {data.tokens > 0 ? "Pack disponible" : "Aucun pack"}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Pack surprise — basic, animal, pokémon, premium ou mythique
            </p>
            <Button
              onClick={handleOpenPack}
              disabled={data.tokens < 1 || opening}
              className="mt-3 h-10 self-start rounded-xl bg-gradient-orange-intense px-4 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50"
            >
              <Package className="size-3.5" />
              {opening ? "Ouverture..." : "Ouvrir un pack"}
            </Button>
          </div>
        </div>

        {/* Special token row */}
        {data.specialTokens > 0 && (
          <div className="relative mx-5 mb-3 flex items-center gap-3 rounded-2xl bg-amber-500/10 px-3 py-2.5 ring-1 ring-amber-500/40 shadow-[0_0_28px_-8px_rgba(251,191,36,0.6)]">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/20 ring-1 ring-amber-500/50">
              <Star className="size-4 text-amber-300" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300/80">
                Jeton{data.specialTokens > 1 ? "s" : ""} spécial{data.specialTokens > 1 ? "ux" : ""} ×{data.specialTokens}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Tourne la roue : 1, 2, 3 ou 4 jetons normaux
              </p>
            </div>
            <Button
              onClick={() => setShowSpinWheel(true)}
              className="h-9 rounded-lg bg-amber-400 px-3 text-[10px] font-black uppercase tracking-wider text-black hover:bg-amber-300"
            >
              Tourner
            </Button>
          </div>
        )}

        {/* Le chapeau : l'énergie des Gardiens change les odds du prochain pack */}
        {data.odds && data.charges && Object.values(data.charges).some((n) => n > 0) && (
          <div className="relative mx-5 mb-3 rounded-2xl bg-secondary/30 px-3 py-2.5 ring-1 ring-border">
            <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">
              Énergie des gardiens — prochain pack
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["basic", "Basique", PACK_TYPE_WEIGHTS.basic],
                  ["animal_only", "Animal", PACK_TYPE_WEIGHTS.animal_only],
                  ["pokemon_only", "Pokémon", PACK_TYPE_WEIGHTS.pokemon_only],
                  ["premium", "Premium", PACK_TYPE_WEIGHTS.premium],
                  ["mythic", "Mythique", PACK_TYPE_WEIGHTS.mythic],
                ] as [PackType, string, number][]
              ).map(([key, label, base]) => {
                const pct = data.odds!.hat[key];
                const boosted = pct > base;
                const nerfed = pct < base;
                return (
                  <span
                    key={key}
                    className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums ring-1 ${
                      boosted
                        ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
                        : nerfed
                          ? "bg-red-500/10 text-red-300 ring-red-500/30"
                          : "bg-secondary/50 text-muted-foreground ring-transparent"
                    }`}
                  >
                    {label}{" "}
                    {boosted || nerfed ? (
                      <>
                        <span className="text-muted-foreground/50 line-through decoration-1">{base}%</span>
                        {"\u2009→\u2009"}
                        {pct}%
                      </>
                    ) : (
                      <>{pct}%</>
                    )}
                  </span>
                );
              })}
              {(data.odds.wheel["4"] ?? 1) > 1 && (
                <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-amber-300">
                  Roue ×4 : {data.odds.wheel["4"]}%
                </span>
              )}
            </div>
          </div>
        )}

        <div className="relative px-5 pb-4">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-mono tabular-nums uppercase tracking-widest text-muted-foreground">
            <span>Progression</span>
            <span>
              <span className="text-foreground/80">{totalUnique}</span> / {totalAll}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary/40">
            <div
              className="h-full bg-gradient-orange-intense transition-all duration-500"
              style={{ width: `${Math.round((totalUnique / Math.max(totalAll, 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category segmented control */}
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-secondary/30 p-1">
        {(["animal", "pokemon"] as Category[]).map((cat) => {
          const isActive = activeCategory === cat;
          const sec = data[cat === "animal" ? "animals" : "pokemon"];
          const Icon = cat === "animal" ? PawPrint : Zap;
          const total = Object.values(sec.totalsByRarity).reduce((a, b) => a + b, 0);
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setActiveFilter("all");
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-colors ${
                isActive
                  ? "bg-gradient-orange-intense text-black shadow-lg"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              <Icon className="size-4" strokeWidth={2.5} />
              <span>{cat === "animal" ? "Animaux" : "Pokémon"}</span>
              <span className={`opacity-70 ${isActive ? "text-black/70" : ""}`}>
                <StableCount owned={sec.cards.length} total={total} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter row — pills that expand only when active. One line, no scroll. */}
      <div className="mb-5 flex items-center gap-1.5">
        <button
          onClick={() => setActiveFilter("all")}
          className={`flex h-9 items-center gap-1.5 overflow-hidden rounded-xl text-xs font-bold transition-all active:scale-95 ${
            activeFilter === "all"
              ? "bg-primary px-3 text-black shadow-md shadow-primary/30"
              : "size-9 justify-center bg-secondary/40 text-muted-foreground hover:bg-accent"
          }`}
          title={`Tout — ${section.cards.length}`}
        >
          <span className={`size-2 shrink-0 rounded-full ${activeFilter === "all" ? "bg-black" : "bg-primary"}`} />
          {activeFilter === "all" && (
            <>
              <span>Tout</span>
              <span className="font-mono tabular-nums opacity-70">{section.cards.length}</span>
            </>
          )}
        </button>
        {[...RARITIES].reverse().map((r) => {
          const isActive = activeFilter === r;
          const owned = cardsByRarity[r].length;
          const total = section.totalsByRarity[r] || 0;
          return (
            <button
              key={r}
              onClick={() => setActiveFilter(r)}
              className={`flex h-9 items-center gap-1.5 overflow-hidden rounded-xl text-xs font-bold transition-all active:scale-95 ${
                isActive
                  ? `flex-1 justify-center px-3 ${TIER_FILL[r]} ring-1 ${TIER_TEXT[r]} shadow-md`
                  : "size-9 justify-center bg-secondary/40 text-muted-foreground hover:bg-accent"
              }`}
              title={`${RARITY_LABELS[r]} — ${owned}/${total}`}
            >
              <span className={`size-2 shrink-0 rounded-full ${TIER_DOT[r]}`} />
              {isActive && (
                <>
                  <span className="truncate">{RARITY_LABELS[r]}</span>
                  <span className="font-mono tabular-nums opacity-70">
                    {owned}/{total}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* L'Inclassable : le sélecteur de tris absurdes */}
      {has("inclassable") && (
        <div className="mb-4 flex items-center gap-1.5 overflow-x-auto">
          <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            Trier
          </span>
          {(
            [
              ["rarity", "N°"],
              ["name", "Nom"],
              ["height", "Taille"],
              ["weight", "Poids"],
              ["habitat", "Habitat"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all active:scale-95 ${
                sortMode === mode
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                  : "bg-secondary/40 text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* La Roue de la Forge : le fragment gagné, révélé en grand */}
      {forgeWin && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setForgeWin(null)}
        >
          <div className="animate-card-reveal flex flex-col items-center px-8 text-center">
            <div className="pointer-events-none absolute size-64 rounded-full bg-primary/15 blur-3xl" />
            <Flame className={`size-14 ${TIER_TEXT[forgeWin.rarity]}`} />
            <p className="mt-4 font-mono text-[10px] font-black uppercase tracking-[0.35em] text-primary/70">
              La Roue de la Forge
            </p>
            <p className={`mt-2 text-3xl font-black tracking-tighter ${TIER_TEXT[forgeWin.rarity]}`}>
              +1 fragment {RARITY_LABELS[forgeWin.rarity].toLowerCase()}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {forgeWin.category === "animal" ? "côté animaux" : "côté Pokémon"}
            </p>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Toucher pour continuer
            </p>
          </div>
        </div>
      )}

      {/* La Forge : sa jauge est TOUJOURS là, même vide — pleine (20),
          elle paie un tour de la Roue (un fragment garanti, au tirage). */}
      {(
        <div className="mb-3 flex items-center gap-2.5 rounded-2xl bg-secondary/30 px-4 py-2.5 ring-1 ring-border">
          <Flame className="size-4 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-widest text-primary/80">
              La Forge
            </p>
            <div className="mt-1 flex h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-secondary/60">
              <div
                className="bg-gradient-orange rounded-full"
                style={{ width: `${Math.min(100, ((data.charges?.forge ?? 0) / 20) * 100)}%` }}
              />
            </div>
          </div>
          {(data.charges?.forge ?? 0) >= 20 ? (
            <button
              onClick={handleForgeWheel}
              disabled={forging}
              className="animate-pulse rounded-lg bg-primary/20 px-2.5 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-primary ring-1 ring-primary/50 transition-all active:scale-95"
              title="Roue de la Forge — un fragment garanti : 42 % commun, 30 % peu commun, 18 % rare, 10 % épique"
            >
              {forging ? "Elle tourne..." : "Lancer la Roue"}
            </button>
          ) : (
            <span
              className="font-mono text-[10px] font-black tabular-nums text-muted-foreground"
              title="Les Gardiens forgerons la remplissent à chaque éveil — pleine, un fragment t'attend au tirage"
            >
              {data.charges?.forge ?? 0}/20
            </span>
          )}
        </div>
      )}

      {/* Fusion bar — single tier when filter active, summary when "Tout" */}
      {fusionRarity && FUSION_NEXT[fusionRarity] ? (
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-secondary/30 px-4 py-3 ring-1 ring-border">
          <div className="flex items-center gap-2.5">
            <Flame className={`size-4 ${TIER_TEXT[fusionRarity]}`} />
            <span className="text-xs font-bold">
              <span className="font-mono tabular-nums">{fusionShards}</span> fragment{fusionShards !== 1 ? "s" : ""}{" "}
              <span className="text-muted-foreground">{RARITY_LABELS[fusionRarity].toLowerCase()}</span>
            </span>
          </div>
          <Button
            size="sm"
            disabled={!canFuse || fusing !== null}
            onClick={() => handleFuse(fusionRarity)}
            className="h-8 rounded-lg bg-gradient-orange-intense px-3 text-[10px] font-black uppercase tracking-wider text-black disabled:opacity-40"
          >
            {fusing === fusionRarity ? "Fusion..." : `Fusionner ${FUSION_COST}→1`}
          </Button>
        </div>
      ) : activeFilter === "all" && Object.values(section.shards).some((n) => n > 0) ? (
        // Fragments : une seule ligne de pastilles. Les actions (fusion,
        // conversion) n'apparaissent que quand elles sont possibles —
        // sinon la pastille reste un simple compteur.
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          <Flame className="size-3.5 text-muted-foreground" />
          {[...RARITIES].reverse().map((r) => {
            const n = section.shards[r] || 0;
            if (n === 0) return null;
            const next = FUSION_NEXT[r];
            const fuseable = next && n >= FUSION_COST;
            const convBatch = CONVERSION_BATCH[r];
            const convReward = CONVERSION_RATE[r];
            const convertible = n >= convBatch;
            return (
              <span
                key={r}
                className={`inline-flex items-center gap-1.5 rounded-lg ${TIER_FILL[r]} ring-1 px-2 py-1`}
              >
                <span className={`size-1.5 rounded-full ${TIER_DOT[r]}`} />
                <span className={`font-mono text-[11px] font-black tabular-nums ${TIER_TEXT[r]}`}>
                  {n}
                </span>
                {fuseable && (
                  <button
                    onClick={() => handleFuse(r)}
                    disabled={fusing !== null || converting !== null}
                    className="rounded bg-gradient-orange-intense px-1.5 py-px text-[9px] font-black uppercase text-black disabled:opacity-40"
                  >
                    {fusing === r ? "..." : `${FUSION_COST}→1`}
                  </button>
                )}
                {convertible && (
                  <button
                    onClick={() => handleConvert(r)}
                    disabled={converting !== null || fusing !== null}
                    className="rounded bg-secondary px-1.5 py-px text-[9px] font-black uppercase text-foreground/80 ring-1 ring-border disabled:opacity-40"
                  >
                    {converting === r ? "..." : `→${convReward}j`}
                  </button>
                )}
              </span>
            );
          })}
        </div>
      ) : null}

      {/* Cards display */}
      {activeFilter === "all" ? (
        section.cards.length === 0 ? (
          <EmptyState
            big
            title="Vault vide"
            subtitle="Termine une séance pour gagner ton premier jeton et ouvrir ton premier pack."
          />
        ) : (
          <div className="space-y-7">
            {[...RARITIES].reverse().map((r) => {
              const cards = cardsByRarity[r];
              if (cards.length === 0) return null;
              return (
                <section key={r}>
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`h-5 w-1 rounded-full ${TIER_DOT[r]}`} />
                    <h3 className={`text-[11px] font-black uppercase tracking-[0.25em] ${TIER_TEXT[r]}`}>
                      {RARITY_LABELS[r]}
                    </h3>
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                      {cards.length}/{section.totalsByRarity[r] || 0}
                    </span>
                    <div className={`h-px flex-1 ${TIER_DOT[r]} opacity-20`} />
                  </div>
                  {renderGrid(cards)}
                </section>
              );
            })}
          </div>
        )
      ) : tabCards.length === 0 ? (
        <EmptyState
          title={`Aucun ${activeCategory === "animal" ? "animal" : "pokémon"} ${RARITY_LABELS[activeFilter as Rarity].toLowerCase()}`}
          subtitle="Ouvre des packs ou fusionne des fragments pour étendre cette section."
        />
      ) : (
        renderGrid(tabCards)
      )}

      {modalResult && (
        <PackOpenModal result={modalResult} onClose={() => setModalResult(null)} odds={data.odds} />
      )}
      {detailCreature && (
        <CardDetailModal
          creature={detailCreature}
          onClose={() => setDetailCreature(null)}
          onNicknameChange={() => {
            setDetailCreature(null);
            refresh();
          }}
        />
      )}
      {showSpinWheel && (
        <SpinWheelModal
          onClose={() => setShowSpinWheel(false)}
          onAfterSpin={refresh}
        />
      )}
    </div>
  );
}

function EmptyState({ title, subtitle, big = false }: { title: string; subtitle: string; big?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${big ? "py-16" : "py-10"} text-center`}>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary/40 ring-1 ring-border">
        <Vault className="size-7 text-muted-foreground/60" />
      </div>
      <div className="max-w-xs">
        <p className="text-sm font-black tracking-tight">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
