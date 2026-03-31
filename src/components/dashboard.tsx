"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Flame, Weight, Calendar, TrendingUp, AlertTriangle } from "lucide-react";

interface Stats {
  totalSessions: number;
  totalVolume: number;
  streak: number;
  lastSessionDate: string | null;
  daysSinceLastSession: number | null;
  weeklyVolumes: { week: string; volume: number }[];
  topExercises: { name: string; maxWeight: number; totalVolume: number; date: string }[];
  muscleDistribution: { muscleGroup: string; setCount: number }[];
  sessionDates: string[];
  sparklines: Record<string, number[]>;
  suggestions: { muscleGroup: string; daysSince: number }[];
  muscleVolumeOverTime: Record<string, { week: string; volume: number }[]>;
}

const MUSCLE_COLORS = [
  "#ff6b1a", "#ff9a4d", "#e84a00", "#ffb366", "#cc3d00",
  "#ff8533", "#d45a00", "#ffcc99",
];

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
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Streak sem.</p>
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

      {/* Heatmap */}
      {stats.sessionDates.length > 0 && (() => {
        const dateSet = new Set(stats.sessionDates);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weeks = 13;
        const cellSize = 14;
        const gap = 3;
        const W = weeks * (cellSize + gap) + 20;
        const H = 7 * (cellSize + gap) + 16;
        const dayLabels = ["L", "", "M", "", "V", "", "D"];

        // Find the Monday of the current week
        const dayOfWeek = today.getDay() || 7;
        const monday = new Date(today);
        monday.setDate(monday.getDate() - dayOfWeek + 1);

        const cells: { x: number; y: number; active: boolean; date: string }[] = [];
        for (let w = 0; w < weeks; w++) {
          for (let d = 0; d < 7; d++) {
            const cellDate = new Date(monday);
            cellDate.setDate(cellDate.getDate() - (weeks - 1 - w) * 7 + d);
            if (cellDate > today) continue;
            const dateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, "0")}-${String(cellDate.getDate()).padStart(2, "0")}`;
            cells.push({
              x: 20 + w * (cellSize + gap),
              y: d * (cellSize + gap),
              active: dateSet.has(dateStr),
              date: dateStr,
            });
          }
        }

        return (
          <Card className="card-gradient-border">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">
                Frequence (3 mois)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                {dayLabels.map((label, i) => (
                  label && (
                    <text key={i} x={8} y={i * (cellSize + gap) + cellSize - 2} textAnchor="middle" className="fill-muted-foreground text-[7px]">
                      {label}
                    </text>
                  )
                ))}
                {cells.map((c, i) => (
                  <rect
                    key={i}
                    x={c.x}
                    y={c.y}
                    width={cellSize}
                    height={cellSize}
                    rx={3}
                    fill={c.active ? "oklch(0.72 0.21 48)" : "oklch(0.18 0.008 50)"}
                    opacity={c.active ? 1 : 0.5}
                  />
                ))}
              </svg>
            </CardContent>
          </Card>
        );
      })()}

      {/* Suggestions */}
      {stats.suggestions.length > 0 && (
        <Card className="card-gradient-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">
              A travailler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.suggestions.map((s) => (
                <div key={s.muscleGroup} className="flex items-center gap-3">
                  <AlertTriangle className={`size-3.5 shrink-0 ${s.daysSince > 14 ? "text-red-500" : "text-amber-500"}`} />
                  <span className="flex-1 text-sm font-bold">{s.muscleGroup}</span>
                  <span className={`text-sm font-black ${s.daysSince > 14 ? "text-red-500" : "text-amber-500"}`}>
                    {s.daysSince}j
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly volume chart */}
      {stats.weeklyVolumes.length > 0 && (() => {
        const W = 320;
        const H = 140;
        const padTop = 20;
        const padBottom = 20;
        const n = stats.weeklyVolumes.length;
        const barGap = 6;
        const barW = Math.min(36, (W - 16 - barGap * (n - 1)) / n);
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

      {/* Records with sparklines */}
      {stats.topExercises.length > 0 && (
        <Card className="card-gradient-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">
              Records personnels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto pr-1">
              <table className="w-full">
                <tbody>
                  {stats.topExercises.map((ex, i) => {
                    const spark = stats.sparklines[ex.name] || [];
                    const sparkW = 48;
                    const sparkH = 18;
                    let sparkPath = "";
                    if (spark.length > 1) {
                      const min = Math.min(...spark);
                      const max = Math.max(...spark);
                      const range = max - min || 1;
                      sparkPath = spark
                        .map((v, j) => {
                          const x = (j / (spark.length - 1)) * sparkW;
                          const y = sparkH - ((v - min) / range) * (sparkH - 2) - 1;
                          return `${j === 0 ? "M" : "L"} ${x} ${y}`;
                        })
                        .join(" ");
                    }
                    return (
                      <tr key={i} className="transition-colors hover:bg-secondary/30">
                        <td className="py-2 pl-2 pr-2">
                          <Trophy className="size-3.5 text-yellow-500/70" />
                        </td>
                        <td className="max-w-[100px] py-2 pr-2">
                          <p className="truncate text-sm font-bold">{ex.name}</p>
                        </td>
                        <td className="py-2 pr-2">
                          {sparkPath && (
                            <svg width={sparkW} height={sparkH} viewBox={`0 0 ${sparkW} ${sparkH}`}>
                              <path d={sparkPath} fill="none" stroke="oklch(0.72 0.21 48)" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-2 pr-2 text-right text-sm font-black text-primary">
                          {ex.maxWeight} kg
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Muscle volume over time */}
      {Object.keys(stats.muscleVolumeOverTime).length > 0 && (() => {
        const muscles = Object.keys(stats.muscleVolumeOverTime);
        const allWeeks = [...new Set(muscles.flatMap((m) => stats.muscleVolumeOverTime[m].map((w) => w.week)))].sort();
        const W = 320;
        const H = 160;
        const padTop = 16;
        const padBottom = 20;
        const padX = 8;
        const chartW = W - padX * 2;
        const chartH = H - padTop - padBottom;

        // Find max volume across all muscles
        let maxVol = 0;
        for (const m of muscles) {
          for (const w of stats.muscleVolumeOverTime[m]) {
            if (w.volume > maxVol) maxVol = w.volume;
          }
        }
        if (maxVol === 0) maxVol = 1;

        return (
          <Card className="card-gradient-border">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">
                Volume par muscle / semaine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                {muscles.map((muscle, mi) => {
                  const data = stats.muscleVolumeOverTime[muscle];
                  const color = MUSCLE_COLORS[mi % MUSCLE_COLORS.length];
                  const path = allWeeks.map((week, wi) => {
                    const entry = data.find((d) => d.week === week);
                    const vol = entry ? entry.volume : 0;
                    const x = padX + (allWeeks.length > 1 ? (wi / (allWeeks.length - 1)) * chartW : chartW / 2);
                    const y = padTop + chartH - (vol / maxVol) * chartH;
                    return `${wi === 0 ? "M" : "L"} ${x} ${y}`;
                  }).join(" ");
                  return (
                    <path key={muscle} d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.8} />
                  );
                })}
                {/* X axis labels */}
                {allWeeks.map((week, wi) => {
                  const x = padX + (allWeeks.length > 1 ? (wi / (allWeeks.length - 1)) * chartW : chartW / 2);
                  const d = new Date(week);
                  return (
                    <text key={wi} x={x} y={H - 4} textAnchor="middle" className="fill-muted-foreground text-[7px]">
                      {`${d.getDate()}/${d.getMonth() + 1}`}
                    </text>
                  );
                })}
              </svg>
              {/* Legend */}
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {muscles.map((muscle, mi) => (
                  <div key={muscle} className="flex items-center gap-1">
                    <div className="size-2 rounded-full" style={{ backgroundColor: MUSCLE_COLORS[mi % MUSCLE_COLORS.length] }} />
                    <span className="text-[9px] font-bold text-muted-foreground">{muscle}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Muscle distribution */}
      {stats.muscleDistribution.length > 0 && (
        <Card className="card-gradient-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">
              Repartition muscles
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
