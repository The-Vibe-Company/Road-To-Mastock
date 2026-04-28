"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionState {
  terminatedAt: string | null;
  tokensGrantedAt: string | null;
  hasSets: boolean;
}

export function TerminateSessionButton({ sessionId }: { sessionId: number }) {
  const [state, setState] = useState<SessionState | null>(null);
  const [busy, setBusy] = useState(false);
  const [grantedThisClick, setGrantedThisClick] = useState(false);

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
    setGrantedThisClick(false);
    try {
      const r = await fetch(`/api/sessions/${sessionId}/terminate`, { method: "POST" });
      if (!r.ok) return;
      const data = await r.json();
      if (data.tokenGranted) setGrantedThisClick(true);
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
        {grantedThisClick && (
          <Link
            href="/collection"
            className="flex items-center gap-2 rounded-xl bg-gradient-orange-intense px-3 py-2 text-sm font-black text-black"
          >
            <Sparkles className="size-4" strokeWidth={3} />
            +1 jeton — ouvre ton pack
          </Link>
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
