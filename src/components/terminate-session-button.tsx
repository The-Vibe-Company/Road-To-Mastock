"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, Loader2, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionState {
  terminatedAt: string | null;
  tokensGrantedAt: string | null;
  hasSets: boolean;
}

interface RewardInfo {
  type: "normal" | "special";
  weekPosition: number | null;
}

export function TerminateSessionButton({ sessionId }: { sessionId: number }) {
  const [state, setState] = useState<SessionState | null>(null);
  const [busy, setBusy] = useState(false);
  const [reward, setReward] = useState<RewardInfo | null>(null);

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
    setReward(null);
    try {
      const r = await fetch(`/api/sessions/${sessionId}/terminate`, { method: "POST" });
      if (!r.ok) return;
      const data = await r.json();
      if (data.specialTokenGranted) {
        setReward({ type: "special", weekPosition: data.weekPosition ?? null });
      } else if (data.tokenGranted) {
        setReward({ type: "normal", weekPosition: data.weekPosition ?? null });
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
        {reward && (
          <div className="flex flex-col gap-1.5">
            {reward.type === "special" ? (
              <Link
                href="/collection"
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-sm font-black text-black shadow-[0_0_28px_-8px_rgba(251,191,36,0.7)]"
              >
                <Star className="size-4" strokeWidth={3} />
                +1 jeton spécial — tourne la roue
              </Link>
            ) : (
              <Link
                href="/collection"
                className="flex items-center gap-2 rounded-xl bg-gradient-orange-intense px-3 py-2 text-sm font-black text-black"
              >
                <Sparkles className="size-4" strokeWidth={3} />
                +1 jeton — ouvre ton pack
              </Link>
            )}
            {reward.weekPosition !== null && (
              <span className="inline-flex w-fit items-center gap-1 rounded-md bg-secondary/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ring-1 ring-border">
                {reward.weekPosition === 1
                  ? "1ʳᵉ séance de la semaine"
                  : reward.weekPosition === 4
                    ? "4ᵉ séance de la semaine"
                    : `Séance ${reward.weekPosition} de la semaine`}
              </span>
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
