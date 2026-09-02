"use client";

import { useMemo, useState } from "react";
import { ACCENT_PRESETS, ACCENT_KEYS, SEALED_ACCENTS, isCustomAccent, resolveAccent } from "@/lib/colors";
import { useAccent } from "./accent-provider";
import { useTalents } from "./talents-provider";
import { useTrophies } from "./trophies-provider";
import { colorTrophyHint, unlockedTrophyColors } from "@/lib/trophies";
import { Check, Gem, Lock, Palette } from "@/components/icons";

export function ColorPicker() {
  const { color, setColor } = useAccent();
  // Parures scellées débloquées par les Talents — invisibles tant que la
  // carte n'est pas possédée : pas de case grisée, pas d'indice, le secret
  // reste entier. L'Alpha (Arceus) ajoute la roue chromatique libre.
  const { discovered, has } = useTalents();
  const sealedKeys = useMemo(() => {
    const keys: string[] = [];
    for (const t of discovered) {
      if (t.effect?.kind === "accent") keys.push(...(t.effect.accents ?? []));
    }
    return keys.filter((k) => SEALED_ACCENTS[k]);
  }, [discovered]);
  const hasAlpha = has("alpha");
  // Les couleurs de base se méritent : le cabinet des trophées les libère.
  const { earned, loaded: trophiesLoaded } = useTrophies();
  const trophyColors = unlockedTrophyColors(earned);
  const [hue, setHue] = useState(() => {
    const m = color.match(/^custom:(\d{1,3})$/);
    return m ? parseInt(m[1], 10) : 200;
  });

  const renderSwatch = (key: string, sealed: boolean) => {
    const preset = sealed
      ? resolveAccent(key) ?? SEALED_ACCENTS[key]
      : ACCENT_PRESETS[key];
    const isActive = color === key;
    // Une couleur de base non gagnée s'affiche verrouillée, avec le trophée
    // qui l'ouvre — l'objectif est public, contrairement aux Talents.
    const lockedByTrophy = !sealed && trophiesLoaded && !trophyColors.has(key);
    return (
      <button
        key={key}
        onClick={() => !lockedByTrophy && setColor(key)}
        disabled={lockedByTrophy}
        className="flex flex-col items-center gap-1.5"
      >
        <div
          className={`relative flex size-12 items-center justify-center rounded-full transition-all ${
            isActive
              ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110"
              : lockedByTrophy
                ? "opacity-35 grayscale"
                : "hover:scale-105"
          }`}
          style={{ background: `linear-gradient(135deg, ${preset.gradientStart}, ${preset.gradientEnd})` }}
        >
          {isActive && <Check className="size-5 text-white drop-shadow-md" strokeWidth={3} />}
          {lockedByTrophy && <Lock className="size-4 text-white drop-shadow-md" />}
          {sealed && !isActive && (
            <Gem className="absolute -right-0.5 -top-0.5 size-3.5 text-white drop-shadow" />
          )}
        </div>
        <span className={`text-[10px] font-bold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
          {lockedByTrophy ? colorTrophyHint(key) ?? preset.label : preset.label}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        {ACCENT_KEYS.map((key) => renderSwatch(key, false))}
      </div>
      {sealedKeys.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/60">
            <Gem className="size-3" />
            Parures scellées
          </p>
          <div className="grid grid-cols-5 gap-3">
            {sealedKeys.map((key) => renderSwatch(key, true))}
          </div>
        </div>
      )}
      {hasAlpha && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/60">
            <Palette className="size-3" />
            L&apos;Alpha — roue chromatique libre
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={360}
              value={hue}
              onChange={(e) => setHue(parseInt(e.target.value, 10))}
              onMouseUp={() => setColor(`custom:${hue}`)}
              onTouchEnd={() => setColor(`custom:${hue}`)}
              className="h-3 flex-1 appearance-none rounded-full"
              style={{
                background:
                  "linear-gradient(to right, oklch(0.7 0.19 0), oklch(0.7 0.19 60), oklch(0.7 0.19 120), oklch(0.7 0.19 180), oklch(0.7 0.19 240), oklch(0.7 0.19 300), oklch(0.7 0.19 360))",
              }}
            />
            <button
              onClick={() => setColor(`custom:${hue}`)}
              className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-all ${
                isCustomAccent(color) ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""
              }`}
              style={{ background: `oklch(0.7 0.19 ${hue})` }}
            >
              {isCustomAccent(color) && <Check className="size-4 text-white" strokeWidth={3} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
