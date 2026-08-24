"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SessionCard } from "./session-card";
import { Dashboard } from "./dashboard";
import { ExerciseRanking } from "./exercise-ranking";

interface Session {
  id: number;
  date: string;
  exerciseCount: number;
  totalVolume: number;
  gold: number;
  silver: number;
  bronze: number;
}

type Tab = "dashboard" | "sessions" | "exercises";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "sessions", label: "Seances" },
  { id: "exercises", label: "Exercices" },
];

export function HomeTabs({ sessions }: { sessions: Session[] }) {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("tab");
  const initial: Tab =
    fromUrl === "sessions" || fromUrl === "exercises" ? fromUrl : "dashboard";
  const [tab, setTab] = useState<Tab>(initial);

  const switchTab = (t: Tab) => {
    setTab(t);
    window.history.replaceState(null, "", t === "dashboard" ? "/" : `/?tab=${t}`);
  };

  return (
    <>
      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-xl bg-secondary/50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`flex-1 rounded-lg px-2 py-2 text-sm font-bold transition-all ${
              tab === t.id
                ? "bg-gradient-orange-intense text-black shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={tab === "dashboard" ? "" : "hidden"}>
        <Dashboard />
      </div>
      {tab === "sessions" && (
        sessions.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <span className="text-3xl">🏋️</span>
            </div>
            <div>
              <p className="font-semibold">Aucune seance</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Commence ta premiere seance
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                id={s.id}
                date={s.date}
                exerciseCount={s.exerciseCount}
                totalVolume={s.totalVolume}
                gold={s.gold}
                silver={s.silver}
                bronze={s.bronze}
              />
            ))}
          </div>
        )
      )}
      {tab === "exercises" && <ExerciseRanking />}
    </>
  );
}
