"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, Music } from "@/components/icons";
import { useTalents } from "./talents-provider";

const PRESETS = [30, 60, 90, 120];

export function RestTimer({ onDismiss }: { onDismiss: () => void }) {
  // La Colonne (Onix) : le chrono devient une chaîne de roches qui
  // s'effrite. La Berceuse (Rondoudou) : il chante pendant le repos.
  const { has, assets } = useTalents();
  const colonne = has("colonne");
  const serpent = has("cercle-parfait");
  const jigglypuff = has("berceuse") ? assets["berceuse"] : null;
  const [duration, setDuration] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const finish = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      navigator.vibrate?.([200, 100, 200]);
    } catch {}
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (duration === null) return;
    setRemaining(duration);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const left = Math.max(0, duration - elapsed);
      setRemaining(left);
      if (left <= 0) finish();
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [duration, finish]);

  const progress = duration ? 1 - remaining / duration : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  // Preset selection
  if (duration === null) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-secondary/30 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Repos</span>
        {PRESETS.map((s) => (
          <button
            key={s}
            onClick={() => setDuration(s)}
            className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
          >
            {s >= 60 ? `${s / 60}min` : `${s}s`}
          </button>
        ))}
        <button onClick={onDismiss} className="ml-auto text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  // Countdown
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  const display = mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs}`;

  // La Colonne : 10 segments de roche, ceux du temps écoulé s'effritent.
  const ROCKS = 10;
  const crumbled = Math.floor(progress * ROCKS);

  return (
    <div className="flex items-center justify-center gap-4 rounded-xl bg-secondary/30 px-4 py-3">
      {jigglypuff && (
        <div className="relative size-12 shrink-0">
          <Image src={jigglypuff} alt="" fill unoptimized className="object-contain" />
          <Music className="note absolute -right-1 top-0 size-3 text-primary/70" />
          <Music className="note note-2 absolute -right-2 top-1 size-2.5 text-primary/50" />
          <Music className="note note-3 absolute right-0 -top-1 size-2 text-primary/40" />
        </div>
      )}
      {colonne ? (
        <div className="flex flex-1 flex-col items-center gap-2">
          <span className="text-2xl font-black tabular-nums">{display}</span>
          <div className="flex w-full max-w-[200px] gap-1">
            {Array.from({ length: ROCKS }, (_, i) => (
              <div
                key={i}
                className={`h-3 flex-1 rounded-sm transition-all duration-300 ${
                  i < crumbled
                    ? "scale-y-[0.3] bg-muted-foreground/20"
                    : "bg-gradient-to-b from-stone-400 to-stone-600 shadow-sm"
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        <svg width="80" height="80" viewBox="0 0 80 80">
          {serpent && (
            <defs>
              <linearGradient id="ouro" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8fe6a0" />
                <stop offset="100%" stopColor="#1e6b3a" />
              </linearGradient>
            </defs>
          )}
          <circle
            cx="40" cy="40" r={radius}
            fill="none" stroke="var(--border)" strokeWidth="5"
          />
          <circle
            cx="40" cy="40" r={radius}
            fill="none" stroke={serpent ? "url(#ouro)" : "var(--primary)"} strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            transform="rotate(-90 40 40)"
            className="transition-[stroke-dashoffset] duration-100"
          />
          {/* La tête du serpent, qui poursuit sa propre queue */}
          {serpent && (
            <circle
              cx={40 + radius * Math.cos(progress * 2 * Math.PI - Math.PI / 2)}
              cy={40 + radius * Math.sin(progress * 2 * Math.PI - Math.PI / 2)}
              r="4.5"
              fill="#8fe6a0"
              className="transition-all duration-100"
            />
          )}
          <text x="40" y="44" textAnchor="middle" className="fill-foreground text-lg font-black">
            {display}
          </text>
        </svg>
      )}
      <button
        onClick={onDismiss}
        className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
      >
        Skip
      </button>
    </div>
  );
}
