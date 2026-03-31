"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Flame, Weight, Calendar, TrendingUp } from "lucide-react";

interface Stats {
  totalSessions: number;
  totalVolume: number;
  streak: number;
  lastSessionDate: string | null;
  daysSinceLastSession: number | null;
  weeklyVolumes: { week: string; volume: number }[];
  topExercises: { name: string; maxWeight: number; totalVolume: number; date: string }[];
  muscleDistribution: { muscleGroup: string; setCount: number }[];
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm font-medium text-primary/60">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const totalMuscleSets = stats.muscleDistribution.reduce((s, m) => s + m.setCount, 0);
  const maxWeeklyVolume = Math.max(...stats.weeklyVolumes.map((w) => w.volume), 1);

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="card-gradient-border">
          <CardContent className="flex items-center gap-3 py-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Flame className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-black text-primary">{stats.totalSessions}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Seances</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient-border">
          <CardContent className="flex items-center gap-3 py-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Weight className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-black text-primary">
                {stats.totalVolume >= 1000
                  ? `${(stats.totalVolume / 1000).toFixed(1)}t`
                  : `${stats.totalVolume}kg`}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Volume total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient-border">
          <CardContent className="flex items-center gap-3 py-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-black text-primary">{stats.streak}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Streak jours</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient-border">
          <CardContent className="flex items-center gap-3 py-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-black text-primary">
                {stats.daysSinceLastSession !== null ? (stats.daysSinceLastSession === 0 ? "Auj." : `${stats.daysSinceLastSession}j`) : "-"}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dernier entr.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly volume chart */}
      {stats.weeklyVolumes.length > 0 && (() => {
        const W = 320;
        const H = 140;
        const padTop = 20;
        const padBottom = 20;
        const padX = 8;
        const n = stats.weeklyVolumes.length;
        const barGap = 6;
        const barW = Math.min(36, (W - padX * 2 - barGap * (n - 1)) / n);
        const chartH = H - padTop - padBottom;
        const totalBarArea = n * barW + (n - 1) * barGap;
        const offsetX = (W - totalBarArea) / 2;

        return (
          <Card className="card-gradient-border">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">
                Volume par semaine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff9a4d" />
                    <stop offset="100%" stopColor="#e84a00" />
                  </linearGradient>
                </defs>
                {stats.weeklyVolumes.map((w, i) => {
                  const pct = maxWeeklyVolume > 0 ? w.volume / maxWeeklyVolume : 0;
                  const barH = Math.max(pct * chartH, 3);
                  const x = offsetX + i * (barW + barGap);
                  const y = padTop + chartH - barH;
                  const weekDate = new Date(w.week);
                  const label = `${weekDate.getDate()}/${weekDate.getMonth() + 1}`;
                  const valLabel = w.volume >= 1000 ? `${(w.volume / 1000).toFixed(1)}t` : `${w.volume}`;
                  return (
                    <g key={i}>
                      <rect x={x} y={y} width={barW} height={barH} rx={4} fill="url(#barGrad)" />
                      <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="fill-primary/70 text-[8px] font-bold">
                        {valLabel}
                      </text>
                      <text x={x + barW / 2} y={H - 4} textAnchor="middle" className="fill-muted-foreground text-[8px]">
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </CardContent>
          </Card>
        );
      })()}

      {/* All exercises - records */}
      {stats.topExercises.length > 0 && (
        <Card className="card-gradient-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">
              Records personnels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {stats.topExercises.map((ex, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary/30">
                  <Trophy className="size-3.5 shrink-0 text-yellow-500/70" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{ex.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-black text-primary">{ex.maxWeight} kg</span>
                    <span className="text-[10px] text-muted-foreground">
                      {ex.totalVolume >= 1000
                        ? `${(ex.totalVolume / 1000).toFixed(1)}t vol.`
                        : `${ex.totalVolume}kg vol.`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Muscle distribution */}
      {stats.muscleDistribution.length > 0 && (
        <Card className="card-gradient-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">
              Muscles travailles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {stats.muscleDistribution.map((m) => {
                const pct = totalMuscleSets > 0 ? Math.round((m.setCount / totalMuscleSets) * 100) : 0;
                return (
                  <div key={m.muscleGroup}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-bold">{m.muscleGroup}</span>
                      <span className="text-[10px] font-bold text-primary">{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary/50">
                      <div
                        className="h-full rounded-full bg-gradient-orange"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
