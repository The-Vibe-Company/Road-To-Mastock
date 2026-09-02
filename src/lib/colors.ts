export interface AccentPreset {
  l: number;
  c: number;
  h: number;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  hex: string;
  label: string;
}

export const ACCENT_PRESETS: Record<string, AccentPreset> = {
  orange:  { l: 0.72, c: 0.21, h: 48,  gradientStart: "#ff8a3d", gradientMid: "#ff5f0f", gradientEnd: "#e84a00", hex: "#FE6B00", label: "Orange" },
  red:     { l: 0.62, c: 0.24, h: 25,  gradientStart: "#ef5350", gradientMid: "#e53935", gradientEnd: "#c62828", hex: "#E53935", label: "Rouge" },
  pink:    { l: 0.65, c: 0.22, h: 350, gradientStart: "#f06292", gradientMid: "#ec407a", gradientEnd: "#c2185b", hex: "#EC407A", label: "Rose" },
  purple:  { l: 0.60, c: 0.22, h: 300, gradientStart: "#ce93d8", gradientMid: "#ab47bc", gradientEnd: "#8e24aa", hex: "#AB47BC", label: "Violet" },
  blue:    { l: 0.68, c: 0.17, h: 250, gradientStart: "#64b5f6", gradientMid: "#42a5f5", gradientEnd: "#1e88e5", hex: "#42A5F5", label: "Bleu" },
  cyan:    { l: 0.75, c: 0.13, h: 200, gradientStart: "#4dd0e1", gradientMid: "#26c6da", gradientEnd: "#00acc1", hex: "#26C6DA", label: "Cyan" },
  green:   { l: 0.70, c: 0.18, h: 150, gradientStart: "#81c784", gradientMid: "#66bb6a", gradientEnd: "#43a047", hex: "#66BB6A", label: "Vert" },
  lime:    { l: 0.75, c: 0.19, h: 125, gradientStart: "#aed581", gradientMid: "#9ccc65", gradientEnd: "#7cb342", hex: "#9CCC65", label: "Lime" },
  yellow:  { l: 0.88, c: 0.19, h: 95,  gradientStart: "#fff176", gradientMid: "#ffee58", gradientEnd: "#fdd835", hex: "#FFEE58", label: "Jaune" },
  gold:    { l: 0.82, c: 0.17, h: 85,  gradientStart: "#ffd54f", gradientMid: "#ffca28", gradientEnd: "#ffb300", hex: "#FFB300", label: "Or" },
} as const;

export const ACCENT_KEYS = Object.keys(ACCENT_PRESETS);

// ─── Parures scellées ───────────────────────────────────────────────────────
// Couleurs débloquées par les Talents cachés de certaines cartes. Elles
// n'apparaissent dans le sélecteur qu'une fois le talent découvert, et le
// serveur refuse de les enregistrer sans la carte correspondante.
export const SEALED_ACCENTS: Record<string, AccentPreset> = {
  // Fenrir — acier & sang
  "ragnarok":       { l: 0.58, c: 0.19, h: 20,  gradientStart: "#b8bec9", gradientMid: "#d43f3f", gradientEnd: "#7f1d1d", hex: "#C0392B", label: "Ragnarök" },
  // Apophis — noir absolu + or égyptien
  "eclipse":        { l: 0.78, c: 0.14, h: 90,  gradientStart: "#f5d576", gradientMid: "#d4af37", gradientEnd: "#8a6d1f", hex: "#D4AF37", label: "Éclipse" },
  // Bahamut — or et azur
  "azur-divin":     { l: 0.70, c: 0.15, h: 240, gradientStart: "#ffd76a", gradientMid: "#5aa2ff", gradientEnd: "#1e50c8", hex: "#5AA2FF", label: "Azur Divin" },
  // Darkrai — noir pur, accent gris lunaire
  "nuit-sans-lune": { l: 0.80, c: 0.02, h: 280, gradientStart: "#c9c9d4", gradientMid: "#8b8b9e", gradientEnd: "#3d3d4d", hex: "#8B8B9E", label: "Nuit Sans Lune" },
  // Volcanion — cuivre & vapeur
  "vapeur":         { l: 0.66, c: 0.13, h: 55,  gradientStart: "#e8a87c", gradientMid: "#c87f4a", gradientEnd: "#8a5a2e", hex: "#C87F4A", label: "Vapeur" },
  // Évoli — les trois pierres
  "aquali":         { l: 0.72, c: 0.14, h: 220, gradientStart: "#7fd4f0", gradientMid: "#4aa8d8", gradientEnd: "#2277aa", hex: "#4AA8D8", label: "Aquali" },
  "voltali":        { l: 0.85, c: 0.17, h: 100, gradientStart: "#fff176", gradientMid: "#f0d030", gradientEnd: "#c8a800", hex: "#F0D030", label: "Voltali" },
  "pyroli":         { l: 0.64, c: 0.22, h: 32,  gradientStart: "#ff9a5c", gradientMid: "#f0602a", gradientEnd: "#b83a10", hex: "#F0602A", label: "Pyroli" },
  // Chardonneret — jaune et rouge
  "plumage":        { l: 0.75, c: 0.17, h: 70,  gradientStart: "#ffe08a", gradientMid: "#f0b428", gradientEnd: "#d03828", hex: "#F0B428", label: "Plumage" },
  // Pikachu — jaune foudre
  "foudre":         { l: 0.88, c: 0.19, h: 98,  gradientStart: "#fff59d", gradientMid: "#ffe83a", gradientEnd: "#e8b800", hex: "#FFE83A", label: "Foudre" },
  // Dracaufeu — braise
  "flamme-draco":   { l: 0.65, c: 0.23, h: 38,  gradientStart: "#ffb35c", gradientMid: "#ff7420", gradientEnd: "#c83a00", hex: "#FF7420", label: "Flamme Draco" },
  // Suicune — cyan glacé
  "aurore-boreale": { l: 0.80, c: 0.12, h: 195, gradientStart: "#a5f3fc", gradientMid: "#4dd8e8", gradientEnd: "#0a9cb8", hex: "#4DD8E8", label: "Aurore Boréale" },
  // Ho-Oh — or irisé
  "flamme-sacree":  { l: 0.80, c: 0.16, h: 80,  gradientStart: "#ffe9a8", gradientMid: "#ffc93a", gradientEnd: "#e88a10", hex: "#FFC93A", label: "Flamme Sacrée" },
  // Yamata-no-Orochi — huit têtes, huit teintes : résolue dynamiquement
  // (une par jour de la semaine) par resolveAccent.
  "huit-vallees":   { l: 0.70, c: 0.19, h: 0,   gradientStart: "#ff8a3d", gradientMid: "#ff5f0f", gradientEnd: "#e84a00", hex: "#B366FF", label: "Huit Vallées" },
  // Deoxys — l'aurore glisse avec l'heure : résolue dynamiquement.
  "aurore-australe": { l: 0.72, c: 0.16, h: 0,  gradientStart: "#7fd4f0", gradientMid: "#a78bfa", gradientEnd: "#f472b6", hex: "#A78BFA", label: "Aurore Australe" },
  // L'Hydre — vert acide
  "venin":          { l: 0.80, c: 0.22, h: 130, gradientStart: "#d4f542", gradientMid: "#9ee82a", gradientEnd: "#5cb810", hex: "#9EE82A", label: "Venin" },
  // Léviathan — bleu des grandes profondeurs
  "abysse":         { l: 0.55, c: 0.16, h: 255, gradientStart: "#4a7fd4", gradientMid: "#2a52b8", gradientEnd: "#12266b", hex: "#2A52B8", label: "Abysse" },
  // Niðhöggr — brun-bronze des racines
  "ecorce":         { l: 0.58, c: 0.10, h: 60,  gradientStart: "#c9a06a", gradientMid: "#96703d", gradientEnd: "#5c3f1e", hex: "#96703D", label: "Écorce" },
  // Genesect — violet plasma
  "plasma":         { l: 0.66, c: 0.24, h: 310, gradientStart: "#e879f9", gradientMid: "#c026d3", gradientEnd: "#7c1a8a", hex: "#C026D3", label: "Plasma" },
  // Qilin — jade céleste
  "jade":           { l: 0.74, c: 0.11, h: 165, gradientStart: "#8fe6c2", gradientMid: "#4cc39a", gradientEnd: "#1e8266", hex: "#4CC39A", label: "Jade" },
};

// Teintes des Huit Vallées, une par jour (lundi → dimanche + la 8ᵉ tête
// pour les jours de pleine lune, jamais atteinte : clin d'œil).
const OROCHI_HUES = [25, 145, 210, 300, 355, 90, 250, 60];

// Fabrique un preset complet à partir d'une teinte oklch.
function presetFromHue(h: number, label: string): AccentPreset {
  return {
    l: 0.70,
    c: 0.19,
    h,
    gradientStart: `oklch(0.78 0.17 ${h})`,
    gradientMid: `oklch(0.68 0.20 ${h})`,
    gradientEnd: `oklch(0.55 0.19 ${h})`,
    hex: `oklch(0.70 0.19 ${h})`,
    label,
  };
}

// Résout un preset, scellé ou non. Trois clés sont dynamiques :
// - "huit-vallees" (Orochi) : la teinte tourne avec le jour de la semaine ;
// - "aurore-australe" (Deoxys) : la teinte glisse avec l'heure ;
// - "custom:<h>" (l'Alpha d'Arceus) : teinte libre 0-360.
export function resolveAccent(key: string, now: Date = new Date()): AccentPreset | null {
  if (key === "huit-vallees") {
    const day = (now.getDay() + 6) % 7; // lundi = 0
    return presetFromHue(OROCHI_HUES[day], "Huit Vallées");
  }
  if (key === "aurore-australe") {
    // Une révolution complète de teinte sur 24 h, ancrée sur le violet la nuit.
    const h = Math.round(((now.getHours() * 60 + now.getMinutes()) / 1440) * 360 + 260) % 360;
    return presetFromHue(h, "Aurore Australe");
  }
  const custom = key.match(/^custom:(\d{1,3})$/);
  if (custom) {
    const h = Math.min(360, parseInt(custom[1], 10));
    return presetFromHue(h, "Alpha");
  }
  return ACCENT_PRESETS[key] ?? SEALED_ACCENTS[key] ?? null;
}

export function isCustomAccent(key: string): boolean {
  return /^custom:\d{1,3}$/.test(key);
}
