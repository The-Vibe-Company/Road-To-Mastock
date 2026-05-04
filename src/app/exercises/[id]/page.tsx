"use client";

import { use, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Trophy, Calendar, Clock, Flame } from "lucide-react";
import { BackButton } from "@/components/back-button";

interface ExerciseInfo {
  id: number;
  name: string;
  kind: "muscu" | "cardio";
  muscleGroup: string | null;
  muscleGroups: string[];
}

interface SetEntry {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  durationMinutes: number | null;
  calories: number | null;
  distanceKm: number | null;
  avgSpeedKmh: number | null;
  resistanceLevel: number | null;
}

interface SessionHistory {
  date: string;
  sessionId: number;
  sets: SetEntry[];
}

interface HistoryData {
  exercise: ExerciseInfo;
  history: SessionHistory[];
}

type MuscuTab = "weight" | "volume";
type CardioTab = "calories" | "duration" | "distance";

export default function ExerciseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [muscuTab, setMuscuTab] = useState<MuscuTab>("weight");
  const [cardioTab, setCardioTab] = useState<CardioTab>("calories");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

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
  const isCardio = exercise.kind === "cardio";

  const totalSessions = history.length;

  // Aggregate per session
  const muscuChartData = history.map((h) => ({
    date: h.date,
    maxWeight: Math.max(0, ...h.sets.map((s) => s.weightKg ?? 0)),
    totalVolume: h.sets.reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0),
  }));
  const cardioChartData = history.map((h) => ({
    date: h.date,
    calories: h.sets.reduce((sum, s) => sum + (s.calories ?? 0), 0),
    duration: h.sets.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0),
    distance: h.sets.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0),
  }));

  const bestWeight = isCardio ? 0 : Math.max(0, ...muscuChartData.map((d) => d.maxWeight));
  const bestDuration = isCardio ? Math.max(0, ...cardioChartData.map((d) => d.duration)) : 0;
  const bestCalories = isCardio ? Math.max(0, ...cardioChartData.map((d) => d.calories)) : 0;

  const cardioHasDistance = isCardio && history.some((h) => h.sets.some((s) => s.distanceKm != null));

  // Build chart values + unit per active tab
  let values: number[] = [];
  let unitLabel = "";
  let chartDates: string[] = [];

  if (isCardio) {
    chartDates = cardioChartData.map((d) => d.date);
    if (cardioTab === "calories") {
      values = cardioChartData.map((d) => d.calories);
      unitLabel = "kcal";
    } else if (cardioTab === "duration") {
      values = cardioChartData.map((d) => d.duration);
      unitLabel = "min";
    } else {
      values = cardioChartData.map((d) => d.distance);
      unitLabel = "km";
    }
  } else {
    chartDates = muscuChartData.map((d) => d.date);
    values = muscuChartData.map((d) => (muscuTab === "weight" ? d.maxWeight : d.totalVolume));
    unitLabel = "kg";
  }

  return (
    <div className="min-h-dvh px-4 pb-8 pt-6">
      <BackButton fallback="/exercises" />

      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">{exercise.name}</h1>
        {exercise.muscleGroups.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {exercise.muscleGroups.map((mg) => (
              <Badge key={mg} variant="secondary" className="font-bold">{mg}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {isCardio ? (
          <>
            <Card className="border-primary/20">
              <CardContent className="flex flex-col items-center gap-1 py-5">
                <Flame className="size-5 text-primary" />
                <p className="text-4xl font-black tracking-tighter text-primary">
                  {bestCalories > 0 ? `${bestCalories}` : "-"}
                </p>
                <p className="text-xs font-medium text-muted-foreground">Max kcal</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center gap-1 py-5">
                <Clock className="size-5 text-muted-foreground" />
                <p className="text-4xl font-black tracking-tighter">
                  {bestDuration > 0 ? `${bestDuration}` : "-"}
                </p>
                <p className="text-xs font-medium text-muted-foreground">Max min</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="border-primary/20">
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
                <p className="text-4xl font-black tracking-tighter">{totalSessions}</p>
                <p className="text-xs font-medium text-muted-foreground">Séances</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Chart */}
      {history.length > 1 && values.some((v) => v > 0) && (() => {
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
          date: chartDates[i],
        }));

        const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
        const areaPath = `${linePath} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

        return (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2 rounded-xl bg-secondary/50 p-1">
                {isCardio ? (
                  <>
                    <button
                      onClick={() => setCardioTab("calories")}
                      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        cardioTab === "calories"
                          ? "bg-gradient-orange-intense text-black shadow-lg"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Calories
                    </button>
                    <button
                      onClick={() => setCardioTab("duration")}
                      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        cardioTab === "duration"
                          ? "bg-gradient-orange-intense text-black shadow-lg"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Durée
                    </button>
                    {cardioHasDistance && (
                      <button
                        onClick={() => setCardioTab("distance")}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          cardioTab === "distance"
                            ? "bg-gradient-orange-intense text-black shadow-lg"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Distance
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setMuscuTab("weight")}
                      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        muscuTab === "weight"
                          ? "bg-gradient-orange-intense text-black shadow-lg"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Poids max
                    </button>
                    <button
                      onClick={() => setMuscuTab("volume")}
                      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        muscuTab === "volume"
                          ? "bg-gradient-orange-intense text-black shadow-lg"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Volume total
                    </button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden" onMouseLeave={() => setHoveredPoint(null)} onTouchEnd={() => setHoveredPoint(null)}>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.7 0.2 45)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="oklch(0.7 0.2 45)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill="url(#chartGrad)" />
                  <path d={linePath} fill="none" stroke="oklch(0.7 0.2 45)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {hoveredPoint !== null && (
                    <line
                      x1={points[hoveredPoint].x}
                      y1={padY}
                      x2={points[hoveredPoint].x}
                      y2={H}
                      stroke="oklch(0.7 0.2 45)"
                      strokeWidth="1"
                      strokeDasharray="4 3"
                      opacity="0.4"
                    />
                  )}
                  {points.map((p, i) => (
                    <g key={i}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={hoveredPoint === i ? 6 : i === points.length - 1 ? 5 : 3}
                        fill={hoveredPoint === i || i === points.length - 1 ? "oklch(0.7 0.2 45)" : "oklch(0.15 0 0)"}
                        stroke="oklch(0.7 0.2 45)"
                        strokeWidth={hoveredPoint === i || i === points.length - 1 ? 0 : 1.5}
                        className="transition-all duration-150"
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={16}
                        fill="transparent"
                        onMouseEnter={() => setHoveredPoint(i)}
                        onTouchStart={() => setHoveredPoint(i)}
                        style={{ cursor: "pointer" }}
                      />
                    </g>
                  ))}
                </svg>

                {hoveredPoint !== null && (() => {
                  const p = points[hoveredPoint];
                  const pctX = (p.x / W) * 100;
                  const dateStr = new Date(p.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
                  const valNum = unitLabel === "km" ? Number(p.value.toFixed(1)) : Math.round(p.value);
                  const val = `${valNum} ${unitLabel}`;
                  const isLeft = pctX < 15;
                  const isRight = pctX > 85;
                  return (
                    <div
                      className="pointer-events-none absolute top-2 z-10"
                      style={{
                        left: `${pctX}%`,
                        transform: isLeft ? "translateX(0%)" : isRight ? "translateX(-100%)" : "translateX(-50%)",
                      }}
                    >
                      <div className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-primary/30 bg-card/95 px-3 py-1.5 shadow-xl backdrop-blur-sm">
                        <span className="text-xs font-black text-primary">{val}</span>
                        <span className="text-[10px] font-medium text-muted-foreground capitalize">{dateStr}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-1 flex justify-between text-[10px] font-medium text-muted-foreground">
                <span>{new Date(chartDates[0]).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                <span>{new Date(chartDates[chartDates.length - 1]).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
              </div>

              <div className="mt-2 flex justify-center gap-4 text-[10px] text-muted-foreground">
                <span>
                  Min: <span className="font-bold text-foreground">{unitLabel === "km" ? Number(minVal.toFixed(1)) : Math.round(minVal)} {unitLabel}</span>
                </span>
                <span>
                  Max: <span className="font-bold text-primary">{unitLabel === "km" ? Number(maxVal.toFixed(1)) : Math.round(maxVal)} {unitLabel}</span>
                </span>
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
              const d = new Date(h.date);
              if (isCardio) {
                const totalDur = h.sets.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
                const totalCal = h.sets.reduce((sum, s) => sum + (s.calories ?? 0), 0);
                return (
                  <Card key={h.sessionId}>
                    <CardContent>
                      <div className="mb-2.5 flex items-center justify-between">
                        <p className="font-bold capitalize">
                          {d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                        </p>
                        <div className="flex gap-1.5">
                          {totalDur > 0 && (
                            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                              {totalDur} min
                            </span>
                          )}
                          {totalCal > 0 && (
                            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                              {totalCal} kcal
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {h.sets.map((s) => (
                          <div key={s.setNumber} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                              {s.setNumber}
                            </span>
                            {s.durationMinutes != null && (
                              <span className="text-sm font-bold">{s.durationMinutes}<span className="ml-0.5 text-xs text-muted-foreground">min</span></span>
                            )}
                            {s.calories != null && (
                              <span className="text-sm font-semibold text-foreground/80">{s.calories}<span className="ml-0.5 text-xs text-muted-foreground">kcal</span></span>
                            )}
                            {s.distanceKm != null && (
                              <span className="text-sm font-semibold text-foreground/80">{s.distanceKm}<span className="ml-0.5 text-xs text-muted-foreground">km</span></span>
                            )}
                            {s.avgSpeedKmh != null && (
                              <span className="text-sm font-semibold text-foreground/80">{s.avgSpeedKmh}<span className="ml-0.5 text-xs text-muted-foreground">km/h</span></span>
                            )}
                            {s.resistanceLevel != null && (
                              <span className="text-sm font-semibold text-foreground/80">niv. {s.resistanceLevel}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              const vol = h.sets.reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0);
              return (
                <Card key={h.sessionId}>
                  <CardContent>
                    <div className="mb-2.5 flex items-center justify-between">
                      <p className="font-bold capitalize">
                        {d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                      </p>
                      <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                        {Math.round(vol)} kg vol.
                      </span>
                    </div>
                    <div className="space-y-1">
                      {h.sets.map((s) => (
                        <div key={s.setNumber} className="flex items-center gap-3">
                          <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                            {s.setNumber}
                          </span>
                          <span className="text-base font-black">{s.weightKg ?? 0} kg</span>
                          <span className="text-sm font-bold text-primary/40">x</span>
                          <span className="text-base font-semibold">{s.reps ?? 0}</span>
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
