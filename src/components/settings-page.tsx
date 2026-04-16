"use client";

import { Palette, Sun, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "./color-picker";
import { useAccent } from "./accent-provider";
import { BackButton } from "./back-button";

export function SettingsPage() {
  const { theme, setTheme } = useAccent();

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-12 pt-6">
      <div className="mb-6">
        <BackButton className="mb-3" />
        <h1 className="text-2xl font-black tracking-tight">Parametres</h1>
      </div>

      <div className="space-y-4">
        {/* Theme toggle */}
        <Card className="card-gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/60">
              {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              Theme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme("dark")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                  theme === "dark"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="size-4" />
                Sombre
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                  theme === "light"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="size-4" />
                Clair
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Color picker */}
        <Card className="card-gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/60">
              <Palette className="size-4" />
              Couleur principale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ColorPicker />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
