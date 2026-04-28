"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, Loader2, Sparkles, Flame, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionState {
  terminatedAt: string | null;
  tokensGrantedAt: string | null;
  hasSets: boolean;
}

interface BonusInfo {
  total: number;
  firstOfWeek: boolean;
  thirdOfWeek: boolean;
}

export function TerminateSessionButton({ sessionId }: { sessionId: number }) {
  const [state, setState] = useState<SessionState | null>(null);
  const [busy, setBusy] = useState(false);
  const [bonus, setBonus] = useState<BonusInfo | null>(null);

  const refresh = async () => {
    const r = await fetch(`/api/sessions/${sessionId}`);
    if (!r.ok) return;
    const data = await r.json();
    const hasSets = (data.exercises ?? []).some(
      (ex: { sets?: unknown[] }) => Array.isArray(ex.sets) && ex.sets.length > 0,
    );
    setState({
      terminatedAt: data.terminatedAt ?? null,
      tokensGrantedAt: data.tokensGrantedAt ?? null,
      hasSets,
    });
  };

  useEffect(() => {
    refresh();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTerminate = async () => {
    if (busy || !state) return;
    setBusy(true);
    setBonus(null);
    try {
      const r = await fetch(`/api/sessions/${sessionId}/terminate`, { method: "POST" });
      if (!r.ok) return;
      const data = await r.json();
      if (data.tokenGranted) {
        setBonus({
          total: data.totalGranted ?? 1,
          firstOfWeek: !!data.firstOfWeekBonus,
          thirdOfWeek: !!data.thirdOfWeekBonus,
        });
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleReopen = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/sessions/${sessionId}/terminate`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!state) return null;

  if (state.terminatedAt) {
    return (
      <div className="mb-6 flex flex-col gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 ring-1 ring-emerald-500/30">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-400" />
          <p className="flex-1 text-sm font-bold text-emerald-300">
            Séance clôturée
          </p>
          <button
            onClick={handleReopen}
            disabled={busy}
            className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70 hover:text-emerald-300 disabled:opacity-50"
          >
            Rouvrir
          </button>
        </div>
        {bonus && (
          <div className="flex flex-col gap-1.5">
            <Link
              href="/collection"
              className="flex items-center gap-2 rounded-xl bg-gradient-orange-intense px-3 py-2 text-sm font-black text-black"
            >
              <Sparkles className="size-4" strokeWidth={3} />
              +{bonus.total} jeton{bonus.total > 1 ? "s" : ""} — ouvre ton pack
            </Link>
            {(bonus.firstOfWeek || bonus.thirdOfWeek) && (
              <div className="flex flex-wrap gap-1.5">
                {bonus.firstOfWeek && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300 ring-1 ring-amber-500/40">
                    <Flame className="size-3" />
                    1ʳᵉ de la semaine · +1 bonus
                  </span>
                )}
                {bonus.thirdOfWeek && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-300 ring-1 ring-rose-500/40">
                    <Trophy className="size-3" />
                    3 séances cette semaine · +1 bonus
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (!state.hasSets) return null;

  return (
    <div className="mb-6">
      <Button
        onClick={handleTerminate}
        disabled={busy}
        size="lg"
        className="h-14 w-full rounded-2xl bg-gradient-orange-intense text-base font-bold text-black shadow-lg glow-orange disabled:opacity-100"
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin" strokeWidth={3} />
        ) : (
          <Lock className="size-5" strokeWidth={3} />
        )}
        {busy ? "Clôture..." : "Terminer la séance"}
      </Button>
    </div>
  );
}
