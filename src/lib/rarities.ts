export const RARITIES = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
] as const;

export type Rarity = (typeof RARITIES)[number];

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Commun",
  uncommon: "Peu commun",
  rare: "Rare",
  epic: "Épique",
  legendary: "Légendaire",
  mythic: "Mythique",
};

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  uncommon: 25,
  rare: 15,
  epic: 6,
  legendary: 3,
  mythic: 1,
};

export const RARITY_TARGET_COUNT: Record<Rarity, number> = {
  common: 500,
  uncommon: 250,
  rare: 150,
  epic: 50,
  legendary: 35,
  mythic: 15,
};

export const FUSION_NEXT: Record<Rarity, Rarity | null> = {
  common: "uncommon",
  uncommon: "rare",
  rare: "epic",
  epic: "legendary",
  legendary: "mythic",
  mythic: null,
};

export const FUSION_COST = 3;

// Fragments → tokens conversion. The batch size is what gets consumed
// in one click; the reward is the resulting tokens. Rates are tuned so
// fusion stays more rewarding than conversion at low tiers, and so that
// mythic shards (which can't fuse) still have a meaningful sink.
export const CONVERSION_BATCH: Record<Rarity, number> = {
  common:    5,
  uncommon:  5,
  rare:      5,
  epic:      5,
  legendary: 3,
  mythic:    1,
};
export const CONVERSION_RATE: Record<Rarity, number> = {
  common:    1,
  uncommon:  2,
  rare:      4,
  epic:      8,
  legendary: 10,
  mythic:    10,
};

export const RARITY_COLORS: Record<Rarity, { bg: string; text: string; ring: string }> = {
  common:    { bg: "bg-zinc-500/15",   text: "text-zinc-300",   ring: "ring-zinc-500/30" },
  uncommon:  { bg: "bg-emerald-500/15", text: "text-emerald-300", ring: "ring-emerald-500/40" },
  rare:      { bg: "bg-sky-500/15",    text: "text-sky-300",    ring: "ring-sky-500/40" },
  epic:      { bg: "bg-violet-500/15", text: "text-violet-300", ring: "ring-violet-500/50" },
  legendary: { bg: "bg-amber-500/20",  text: "text-amber-300",  ring: "ring-amber-500/60" },
  mythic:    { bg: "bg-rose-500/20",   text: "text-rose-300",   ring: "ring-rose-500/70" },
};

export function rollRarity(): Rarity {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const rarity of RARITIES) {
    r -= RARITY_WEIGHTS[rarity];
    if (r <= 0) return rarity;
  }
  return "common";
}
