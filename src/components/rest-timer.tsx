"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

const PRESETS = [30, 60, 90, 120];

export function RestTimer({ onDismiss }: { onDismiss: () => void }) {
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

  return (
    <div className="flex items-center justify-center gap-4 rounded-xl bg-secondary/30 px-4 py-3">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle
          cx="40" cy="40" r={radius}
          fill="none" stroke="oklch(0.22 0.012 50)" strokeWidth="5"
        />
        <circle
          cx="40" cy="40" r={radius}
          fill="none" stroke="oklch(0.72 0.21 48)" strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          transform="rotate(-90 40 40)"
          className="transition-[stroke-dashoffset] duration-100"
        />
        <text x="40" y="44" textAnchor="middle" className="fill-foreground text-lg font-black">
          {display}
        </text>
      </svg>
      <button
        onClick={onDismiss}
        className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
      >
        Skip
      </button>
    </div>
  );
}
