"use client";

import { ACCENT_PRESETS, ACCENT_KEYS } from "@/lib/colors";
import { useAccent } from "./accent-provider";
import { Check } from "lucide-react";

export function ColorPicker() {
  const { color, setColor } = useAccent();

  return (
    <div className="grid grid-cols-5 gap-3">
      {ACCENT_KEYS.map((key) => {
        const preset = ACCENT_PRESETS[key];
        const isActive = color === key;
        return (
          <button
            key={key}
            onClick={() => setColor(key)}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className={`flex size-12 items-center justify-center rounded-full transition-all ${
                isActive ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"
              }`}
              style={{ background: `linear-gradient(135deg, ${preset.gradientStart}, ${preset.gradientEnd})` }}
            >
              {isActive && <Check className="size-5 text-white drop-shadow-md" strokeWidth={3} />}
            </div>
            <span className={`text-[10px] font-bold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
              {preset.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
