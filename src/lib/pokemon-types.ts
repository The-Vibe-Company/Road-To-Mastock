// Canonical type colors (TCG-style) + French names
export const POKEMON_TYPE: Record<
  string,
  { fr: string; bg: string; text: string; ring: string }
> = {
  normal:   { fr: "Normal",    bg: "bg-zinc-500/20",    text: "text-zinc-200",    ring: "ring-zinc-500/40" },
  fire:     { fr: "Feu",       bg: "bg-orange-600/25",  text: "text-orange-200",  ring: "ring-orange-500/50" },
  water:    { fr: "Eau",       bg: "bg-blue-500/25",    text: "text-blue-200",    ring: "ring-blue-500/50" },
  electric: { fr: "Électrik",  bg: "bg-yellow-500/25",  text: "text-yellow-200",  ring: "ring-yellow-500/50" },
  grass:    { fr: "Plante",    bg: "bg-green-600/25",   text: "text-green-200",   ring: "ring-green-500/50" },
  ice:      { fr: "Glace",     bg: "bg-cyan-400/20",    text: "text-cyan-100",    ring: "ring-cyan-300/50" },
  fighting: { fr: "Combat",    bg: "bg-red-700/25",     text: "text-red-200",     ring: "ring-red-600/50" },
  poison:   { fr: "Poison",    bg: "bg-fuchsia-700/25", text: "text-fuchsia-200", ring: "ring-fuchsia-500/50" },
  ground:   { fr: "Sol",       bg: "bg-amber-700/25",   text: "text-amber-200",   ring: "ring-amber-600/50" },
  flying:   { fr: "Vol",       bg: "bg-indigo-400/20",  text: "text-indigo-200",  ring: "ring-indigo-400/50" },
  psychic:  { fr: "Psy",       bg: "bg-pink-500/25",    text: "text-pink-200",    ring: "ring-pink-500/50" },
  bug:      { fr: "Insecte",   bg: "bg-lime-600/25",    text: "text-lime-200",    ring: "ring-lime-500/50" },
  rock:     { fr: "Roche",     bg: "bg-stone-600/25",   text: "text-stone-200",   ring: "ring-stone-500/50" },
  ghost:    { fr: "Spectre",   bg: "bg-violet-700/25",  text: "text-violet-200",  ring: "ring-violet-500/50" },
  dragon:   { fr: "Dragon",    bg: "bg-violet-900/30",  text: "text-violet-100",  ring: "ring-violet-700/60" },
  dark:     { fr: "Ténèbres",  bg: "bg-neutral-800/40", text: "text-neutral-200", ring: "ring-neutral-600/60" },
  steel:    { fr: "Acier",     bg: "bg-slate-500/25",   text: "text-slate-200",   ring: "ring-slate-400/50" },
  fairy:    { fr: "Fée",       bg: "bg-rose-400/25",    text: "text-rose-200",    ring: "ring-rose-400/50" },
};

export function typeLabel(slug: string | null | undefined): string {
  if (!slug) return "";
  return POKEMON_TYPE[slug]?.fr ?? slug;
}
