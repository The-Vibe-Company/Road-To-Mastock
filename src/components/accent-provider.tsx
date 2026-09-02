"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { resolveAccent, type AccentPreset } from "@/lib/colors";

interface AccentContextValue {
  color: string;
  setColor: (color: string) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
}

const AccentContext = createContext<AccentContextValue>({
  color: "orange",
  setColor: () => {},
  theme: "dark",
  setTheme: () => {},
});

export function useAccent() {
  return useContext(AccentContext);
}

function applyPreset(preset: AccentPreset) {
  const root = document.documentElement;
  root.style.setProperty("--accent-l", String(preset.l));
  root.style.setProperty("--accent-c", String(preset.c));
  root.style.setProperty("--accent-h", String(preset.h));
  root.style.setProperty("--accent-gradient-start", preset.gradientStart);
  root.style.setProperty("--accent-gradient-mid", preset.gradientMid);
  root.style.setProperty("--accent-gradient-end", preset.gradientEnd);
  // Mémorise les valeurs RÉSOLUES : le script inline du layout les
  // réapplique avant la première peinture — plus de flash orange.
  try {
    localStorage.setItem(
      "rtm-accent",
      JSON.stringify({
        l: preset.l,
        c: preset.c,
        h: preset.h,
        gs: preset.gradientStart,
        gm: preset.gradientMid,
        ge: preset.gradientEnd,
      }),
    );
  } catch {}
}

// Le script inline (injecté dans le layout, avant tout) : rejoue l'accent
// et le thème mémorisés pendant que React se réveille.
export const ACCENT_BOOT_SCRIPT = `
try {
  var a = JSON.parse(localStorage.getItem("rtm-accent") || "null");
  if (a) {
    var r = document.documentElement;
    r.style.setProperty("--accent-l", String(a.l));
    r.style.setProperty("--accent-c", String(a.c));
    r.style.setProperty("--accent-h", String(a.h));
    r.style.setProperty("--accent-gradient-start", a.gs);
    r.style.setProperty("--accent-gradient-mid", a.gm);
    r.style.setProperty("--accent-gradient-end", a.ge);
  }
  var t = localStorage.getItem("rtm-theme");
  if (t === "light" || t === "dark") {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(t);
  }
} catch (e) {}
`;

function applyTheme(theme: "dark" | "light") {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  try {
    localStorage.setItem("rtm-theme", theme);
  } catch {}
}

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [color, setColorState] = useState("orange");
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        const preset = user?.accentColor ? resolveAccent(user.accentColor) : null;
        if (preset) {
          setColorState(user.accentColor);
          applyPreset(preset);
        }
        if (user?.theme && (user.theme === "dark" || user.theme === "light")) {
          setThemeState(user.theme);
          applyTheme(user.theme);
        }
      })
      .catch(() => {});
  }, []);

  const setColor = (c: string) => {
    const preset = resolveAccent(c);
    if (!preset) return;
    setColorState(c);
    applyPreset(preset);
    fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accentColor: c }),
    });
  };

  const setTheme = (t: "dark" | "light") => {
    setThemeState(t);
    applyTheme(t);
    fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: t }),
    });
  };

  return (
    <AccentContext.Provider value={{ color, setColor, theme, setTheme }}>
      {children}
    </AccentContext.Provider>
  );
}
