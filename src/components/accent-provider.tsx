"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ACCENT_PRESETS, type AccentPreset } from "@/lib/colors";

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
}

function applyTheme(theme: "dark" | "light") {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
}

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [color, setColorState] = useState("orange");
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (user?.accentColor && ACCENT_PRESETS[user.accentColor]) {
          setColorState(user.accentColor);
          applyPreset(ACCENT_PRESETS[user.accentColor]);
        }
        if (user?.theme && (user.theme === "dark" || user.theme === "light")) {
          setThemeState(user.theme);
          applyTheme(user.theme);
        }
      })
      .catch(() => {});
  }, []);

  const setColor = (c: string) => {
    const preset = ACCENT_PRESETS[c];
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
