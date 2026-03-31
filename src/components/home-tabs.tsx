"use client";

import { useState } from "react";
import { SessionCard } from "./session-card";
import { Dashboard } from "./dashboard";

interface Session {
  id: number;
  date: string;
  exerciseCount: number;
  totalVolume: number;
  gold: number;
  silver: number;
  bronze: number;
}

export function HomeTabs({ sessions }: { sessions: Session[] }) {
  const [tab, setTab] = useState<"dashboard" | "sessions">("dashboard");

  return (
    <>
      {/* Tabs */}
      <div className="mb-6 flex items-center gap-2 rounded-xl bg-secondary/50 p-1">
        <button
          onClick={() => setTab("dashboard")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
            tab === "dashboard"
              ? "bg-gradient-orange-intense text-black shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setTab("sessions")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
            tab === "sessions"
              ? "bg-gradient-orange-intense text-black shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Seances
        </button>
      </div>

      {/* Content */}
      {tab === "dashboard" ? (
        <Dashboard />
      ) : sessions.length === 0 ? (
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
      )}
    </>
  );
}
