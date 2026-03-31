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
  topExercises: { name: string; maxWeight: number; date: string }[];
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
      {stats.weeklyVolumes.length > 0 && (
        <Card className="card-gradient-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">
              Volume par semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5" style={{ height: 120 }}>
              {stats.weeklyVolumes.map((w, i) => {
                const pct = (w.volume / maxWeeklyVolume) * 100;
                const weekDate = new Date(w.week);
                const label = `${weekDate.getDate()}/${weekDate.getMonth() + 1}`;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-primary/60">
                      {w.volume >= 1000 ? `${(w.volume / 1000).toFixed(1)}t` : `${w.volume}`}
                    </span>
                    <div className="w-full flex-1 flex flex-col justify-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-orange"
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-medium text-muted-foreground">{label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top exercises */}
      {stats.topExercises.length > 0 && (
        <Card className="card-gradient-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">
              Records personnels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topExercises.map((ex, i) => {
                const colors = ["text-yellow-500", "text-gray-400", "text-amber-700"];
                return (
                  <div key={i} className="flex items-center gap-3">
                    <Trophy className={`size-4 ${colors[i]}`} />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{ex.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(ex.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <p className="text-lg font-black text-primary">{ex.maxWeight} kg</p>
                  </div>
                );
              })}
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
