"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Minus, Trophy, Calendar } from "lucide-react";

interface ExerciseInfo {
  id: number;
  name: string;
  muscleGroup: string | null;
}

interface SessionHistory {
  date: string;
  sessionId: number;
  sets: { setNumber: number; weightKg: number; reps: number }[];
}

interface HistoryData {
  exercise: ExerciseInfo;
  history: SessionHistory[];
}

export default function ExerciseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<"weight" | "volume">("weight");

  useEffect(() => {
    fetch(`/api/exercises/${id}/history`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm font-medium text-primary/60">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { exercise, history } = data;

  const maxWeights = history.map((h) =>
    Math.max(...h.sets.map((s) => s.weightKg))
  );
  const bestWeight = maxWeights.length > 0 ? Math.max(...maxWeights) : 0;
  const totalSessions = history.length;

  const chartData = history.map((h) => ({
    date: h.date,
    maxWeight: Math.max(...h.sets.map((s) => s.weightKg)),
    totalVolume: h.sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0),
  }));

  const maxChartWeight = chartData.length > 0 ? Math.max(...chartData.map((d) => d.maxWeight)) : 1;

  return (
    <div className="min-h-dvh px-4 pb-8 pt-6">
      <Link
        href="/exercises"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Catalogue
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">{exercise.name}</h1>
        {exercise.muscleGroup && (
          <div className="mt-2">
            <Badge variant="secondary" className="font-bold">{exercise.muscleGroup}</Badge>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card className="glow-orange border-primary/20">
          <CardContent className="flex flex-col items-center gap-1 py-5">
            <Trophy className="size-5 text-primary" />
            <p className="text-4xl font-black tracking-tighter text-primary">
              {bestWeight > 0 ? `${bestWeight}` : "-"}
            </p>
            <p className="text-xs font-medium text-muted-foreground">Max (kg)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-5">
            <Calendar className="size-5 text-muted-foreground" />
            <p className="text-4xl font-black tracking-tighter">
              {totalSessions}
            </p>
            <p className="text-xs font-medium text-muted-foreground">Séances</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (() => {
        const values = chartData.map((d) =>
          chartTab === "weight" ? d.maxWeight : d.totalVolume
        );
        const maxVal = Math.max(...values);
        const minVal = Math.min(...values);
        const range = maxVal - minVal || 1;
        const W = 320;
        const H = 160;
        const padX = 0;
        const padY = 16;
        const graphW = W - padX * 2;
        const graphH = H - padY * 2;

        const points = values.map((v, i) => ({
          x: padX + (i / (values.length - 1)) * graphW,
          y: padY + graphH - ((v - minVal) / range) * graphH,
          value: v,
          date: chartData[i].date,
        }));

        const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
        const areaPath = `${linePath} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

        return (
          <Card className="mb-6 card-glow">
            <CardHeader>
              <div className="flex items-center gap-2 rounded-xl bg-secondary/50 p-1">
                <button
                  onClick={() => setChartTab("weight")}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    chartTab === "weight"
                      ? "bg-gradient-orange-intense text-black shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Poids max
                </button>
                <button
                  onClick={() => setChartTab("volume")}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    chartTab === "volume"
                      ? "bg-gradient-orange-intense text-black shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Volume total
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.2 45)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="oklch(0.7 0.2 45)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Area */}
                <path d={areaPath} fill="url(#chartGrad)" />
                {/* Line */}
                <path d={linePath} fill="none" stroke="oklch(0.7 0.2 45)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Dots */}
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={i === points.length - 1 ? 5 : 3}
                    fill={i === points.length - 1 ? "oklch(0.7 0.2 45)" : "oklch(0.15 0 0)"}
                    stroke="oklch(0.7 0.2 45)"
                    strokeWidth={i === points.length - 1 ? 0 : 1.5}
                  />
                ))}
              </svg>

              {/* Labels */}
              <div className="mt-1 flex justify-between text-[10px] font-medium text-muted-foreground">
                <span>
                  {new Date(chartData[0].date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
                <span className="font-bold text-primary">
                  {chartTab === "weight"
                    ? `${values[values.length - 1]} kg`
                    : `${Math.round(values[values.length - 1])} kg`}
                </span>
                <span>
                  {new Date(chartData[chartData.length - 1].date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              </div>

              {/* Min / Max */}
              <div className="mt-2 flex justify-center gap-4 text-[10px] text-muted-foreground">
                <span>Min: <span className="font-bold text-foreground">{chartTab === "weight" ? minVal : Math.round(minVal)} kg</span></span>
                <span>Max: <span className="font-bold text-primary">{chartTab === "weight" ? maxVal : Math.round(maxVal)} kg</span></span>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* History */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
            <Minus className="size-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Aucune donnée pour cet exercice
          </p>
        </div>
      ) : (
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-primary/60">
            Historique
          </h2>
          <div className="space-y-3">
            {[...history].reverse().map((h) => {
              const vol = h.sets.reduce(
                (sum, s) => sum + s.weightKg * s.reps,
                0
              );
              const d = new Date(h.date);
              return (
                <Card key={h.sessionId} className="card-glow">
                  <CardContent>
                    <div className="mb-2.5 flex items-center justify-between">
                      <p className="font-bold capitalize">
                        {d.toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                        {Math.round(vol)} kg vol.
                      </span>
                    </div>
                    <div className="space-y-1">
                      {h.sets.map((s) => (
                        <div
                          key={s.setNumber}
                          className="flex items-center gap-3"
                        >
                          <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                            {s.setNumber}
                          </span>
                          <span className="text-base font-black">{s.weightKg} kg</span>
                          <span className="text-sm font-bold text-primary/40">x</span>
                          <span className="text-base font-semibold">{s.reps}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
