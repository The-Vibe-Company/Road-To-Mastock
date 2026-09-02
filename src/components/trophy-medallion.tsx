"use client";

import {
  Activity,
  BookOpen,
  Calendar,
  Cards,
  Dumbbell,
  Flame,
  Layers,
  Lock,
  Trophy,
  Weight,
  Zap,
} from "@/components/icons";
import { TROPHIES } from "@/lib/trophies";
import type { TrophyEntry } from "@/components/trophies-provider";

// ── Les médaillons des trophées ─────────────────────────────────────────────
// Partagés entre la Salle des Trophées et la cérémonie du Palmarès.
// L'icône et la couleur viennent de la famille, le métal vient du grade :
// plus on monte dans une échelle, plus le médaillon devient précieux.

export const TROPHY_FAMILIES: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    // La lumière d'annonce de la famille (fond du halo de la cérémonie).
    glow: string;
    accent: string;
  }
> = {
  sessions: { label: "Les Séances", icon: Flame, glow: "bg-orange-500/15", accent: "text-orange-300" },
  records: { label: "Les Records", icon: Trophy, glow: "bg-yellow-400/15", accent: "text-yellow-300" },
  maxWeight: { label: "La Charge Max", icon: Weight, glow: "bg-red-500/15", accent: "text-red-300" },
  tonnage: { label: "Le Tonnage", icon: Dumbbell, glow: "bg-sky-500/15", accent: "text-sky-300" },
  sets: { label: "Les Séries", icon: Layers, glow: "bg-violet-500/15", accent: "text-violet-300" },
  exercises: { label: "La Variété", icon: BookOpen, glow: "bg-emerald-500/15", accent: "text-emerald-300" },
  streakWeeks: { label: "La Régularité", icon: Calendar, glow: "bg-cyan-400/15", accent: "text-cyan-300" },
  bestWeek: { label: "La Semaine", icon: Zap, glow: "bg-amber-400/15", accent: "text-amber-300" },
  cardioMinutes: { label: "Le Cardio", icon: Activity, glow: "bg-rose-500/15", accent: "text-rose-300" },
  cardsOwned: { label: "La Collection", icon: Cards, glow: "bg-fuchsia-500/15", accent: "text-fuchsia-300" },
};

// bronze → argent → or → platine → mythique
export const METALS = [
  "from-amber-700 to-amber-950 ring-amber-600/60 text-amber-200",
  "from-zinc-400 to-zinc-700 ring-zinc-300/60 text-zinc-100",
  "from-yellow-400 to-amber-600 ring-yellow-300/70 text-yellow-950",
  "from-cyan-300 to-sky-600 ring-cyan-200/70 text-cyan-950",
  "from-rose-400 to-fuchsia-700 ring-rose-300/70 text-rose-50",
];

export const METAL_NAMES = ["Bronze", "Argent", "Or", "Platine", "Mythique"];

export function trophyStatOf(id: string): string {
  return TROPHIES.find((t) => t.id === id)?.stat ?? "sessions";
}

// Grade = position relative dans l'échelle de sa famille : les métaux se
// répartissent sur toute la hauteur, du bronze au mythique.
export function gradeOf(entry: { id: string }): number {
  const stat = trophyStatOf(entry.id);
  const ladder = TROPHIES.filter((t) => t.stat === stat).sort((a, b) => a.target - b.target);
  const idx = ladder.findIndex((t) => t.id === entry.id);
  if (ladder.length <= 1) return METALS.length - 1;
  return Math.round((idx / (ladder.length - 1)) * (METALS.length - 1));
}

export function Medallion({ entry, size = "sm" }: { entry: TrophyEntry; size?: "sm" | "lg" }) {
  const Icon = TROPHY_FAMILIES[trophyStatOf(entry.id)]?.icon ?? Trophy;
  const metal = METALS[gradeOf(entry)];
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-b ring-2 ${metal} ${
        size === "lg" ? "size-20 rounded-2xl" : "size-12"
      } ${entry.earned ? "glow-orange-sm" : "opacity-30 grayscale"}`}
    >
      <Icon className={size === "lg" ? "size-10" : "size-6"} />
      {!entry.earned && (
        <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <Lock className="size-2.5 text-muted-foreground" />
        </span>
      )}
    </div>
  );
}
