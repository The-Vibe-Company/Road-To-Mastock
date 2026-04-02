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
