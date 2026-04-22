"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Minus, Plus, Check, Trophy, Sparkles, Pencil, ArrowLeft, History as HistoryIcon } from "lucide-react";

interface ExerciseSet {
  id: number;
  setNumber: number;
  weightKg: number;
  reps: number;
}

interface HistorySession {
  date: string;
  sessionId: number;
  sets: { setNumber: number; weightKg: number; reps: number }[];
}

interface SessionFocusProps {
  sessionId: number;
  sessionExerciseId: number;
  exerciseId: number;
  name: string;
  muscleGroup: string | null;
  exerciseIndex: number;
  totalExercises: number;
  currentSets: ExerciseSet[];
  onAddSet: (sessionExerciseId: number, weightKg: number, reps: number) => void;
  onDeleteSet: (setId: number) => void;
  onClose: () => void;
}

const PRESETS = [30, 60, 90, 120];
const DEFAULT_TARGET_SETS = 4;

function inferStep(history: HistorySession[]): number | null {
  const allKg = history
    .flatMap((s) => s.sets.map((x) => x.weightKg))
    .sort((a, b) => a - b);
  const deltas: number[] = [];
  for (let i = 1; i < allKg.length; i++) {
    const d = +(allKg[i] - allKg[i - 1]).toFixed(2);
    if (d > 0) deltas.push(d);
  }
  return deltas.length ? Math.min(...deltas) : null;
}

function formatPreset(s: number): string {
  if (s < 60) return `${s}s`;
  if (s % 60 === 0) return `${s / 60}min`;
  return `${Math.floor(s / 60)}min${s % 60}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

export function SessionFocus({
  sessionId,
  sessionExerciseId,
  exerciseId,
  name,
  muscleGroup,
  exerciseIndex,
  totalExercises,
  currentSets,
  onAddSet,
  onDeleteSet,
  onClose,
}: SessionFocusProps) {
  const [history, setHistory] = useState<HistorySession[] | null>(null);
  const [view, setView] = useState<"current" | "history">("current");
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/exercises/${exerciseId}/history`)
      .then((r) => r.json())
      .then((d) => setHistory(d.history as HistorySession[]));
  }, [exerciseId]);

  // History excluding the current session — used for PR, last perf, step inference.
  const prior = useMemo(
    () => (history ?? []).filter((h) => h.sessionId !== sessionId),
    [history, sessionId]
  );

  const step = useMemo(() => inferStep(prior), [prior]);

  const pr = useMemo(() => {
    let best: { kg: number; reps: number; date: string } | null = null;
    for (const session of prior) {
      for (const s of session.sets) {
        if (
          !best ||
          s.weightKg > best.kg ||
          (s.weightKg === best.kg && s.reps > best.reps)
        ) {
          best = { kg: s.weightKg, reps: s.reps, date: session.date };
        }
      }
    }
    return best;
  }, [prior]);

  const last = useMemo(() => {
    if (prior.length === 0) return null;
    const latest = [...prior].sort((a, b) =>
      a.date < b.date ? 1 : -1
    )[0];
    if (!latest || latest.sets.length === 0) return null;
    const best = latest.sets.reduce((acc, s) =>
      s.weightKg > acc.weightKg ||
      (s.weightKg === acc.weightKg && s.reps > acc.reps)
        ? s
        : acc
    );
    return { kg: best.weightKg, reps: best.reps };
  }, [prior]);

  const initialKg = last?.kg ?? pr?.kg ?? 0;
  const initialReps = last?.reps ?? pr?.reps ?? 10;

  // Override values only get set when the user edits — otherwise fall through to
  // history-derived defaults. This avoids the set-state-in-effect lint rule and
  // the flash between "0" (pre-fetch) and the real default.
  const [overrideKg, setOverrideKg] = useState<number | null>(null);
  const [overrideReps, setOverrideReps] = useState<number | null>(null);
  const edited = overrideKg !== null || overrideReps !== null;
  const kg = overrideKg ?? initialKg;
  const reps = overrideReps ?? initialReps;

  // Rest timer state
  const [restOpen, setRestOpen] = useState(false);
  const [restTotal, setRestTotal] = useState(90);
  const [restLeft, setRestLeft] = useState(90);
  const restStartRef = useRef(0);
  useEffect(() => {
    if (!restOpen) return;
    restStartRef.current = Date.now() - (restTotal - restLeft) * 1000;
    const t = setInterval(() => {
      const elapsed = (Date.now() - restStartRef.current) / 1000;
      const left = Math.max(0, restTotal - elapsed);
      setRestLeft(left);
      if (left <= 0) {
        try {
          navigator.vibrate?.([200, 100, 200]);
        } catch {}
        clearInterval(t);
        setRestOpen(false);
      }
    }, 200);
    return () => clearInterval(t);
  }, [restOpen, restTotal]);

  const startRest = (sec: number) => {
    setRestTotal(sec);
    setRestLeft(sec);
    setRestOpen(true);
  };

  // Shift the virtual start time by -delta seconds so the running interval
  // converges to `left + delta` on its next tick (the interval recomputes left
  // from restStartRef every 200ms — just calling setRestLeft would be clobbered).
  // The immediate setRestLeft avoids a visible lag until that next tick.
  const adjustRest = useCallback((delta: number) => {
    restStartRef.current += delta * 1000;
    setRestLeft((s) => Math.max(0, s + delta));
  }, []);

  const handleKg = (v: number) => setOverrideKg(v);
  const handleReps = (v: number) => setOverrideReps(v);
  const resetToLast = () => {
    setOverrideKg(null);
    setOverrideReps(null);
  };

  const handleValidate = useCallback(() => {
    if (kg < 0 || reps <= 0) return;
    onAddSet(sessionExerciseId, kg, reps);
    setOverrideKg(null);
    setOverrideReps(null);
    startRest(90);
  }, [kg, reps, sessionExerciseId, onAddSet]);

  const targetSets = Math.max(DEFAULT_TARGET_SETS, currentSets.length + 1);
  const activeSetNumber = currentSets.length + 1;

  // Close on escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (manualOpen) setManualOpen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [manualOpen, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      {/* Radial accent glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(var(--accent-l) var(--accent-c) var(--accent-h) / 0.10), transparent), radial-gradient(ellipse 60% 40% at 80% 100%, oklch(var(--accent-l) var(--accent-c) var(--accent-h) / 0.05), transparent)",
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 pt-4 pb-3">
        <button
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-colors active:scale-95 hover:text-primary"
          aria-label="Fermer"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex gap-1 rounded-xl bg-card p-1">
          <button
            onClick={() => setView("current")}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-black transition-all ${
              view === "current"
                ? "bg-gradient-orange-intense text-black"
                : "text-muted-foreground"
            }`}
          >
            Actuel
          </button>
          <button
            onClick={() => setView("history")}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-black transition-all ${
              view === "history"
                ? "bg-gradient-orange-intense text-black"
                : "text-muted-foreground"
            }`}
          >
            Historique
          </button>
        </div>
        <div className="size-10" />
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto overflow-x-hidden px-4 pb-36">
        {view === "current" ? (
          <CurrentView
            name={name}
            muscleGroup={muscleGroup}
            exerciseIndex={exerciseIndex}
            totalExercises={totalExercises}
            activeSetNumber={activeSetNumber}
            targetSets={targetSets}
            kg={kg}
            reps={reps}
            setKg={handleKg}
            setReps={handleReps}
            edited={edited}
            step={step}
            last={last}
            pr={pr}
            onManualOpen={() => setManualOpen(true)}
            onReset={resetToLast}
            currentSets={currentSets}
            onDeleteSet={onDeleteSet}
            restOpen={restOpen}
            restTotal={restTotal}
            restLeft={restLeft}
            onStartRest={startRest}
            onStopRest={() => setRestOpen(false)}
            onAdjustRest={adjustRest}
          />
        ) : (
          <HistoryView
            name={name}
            history={history}
            pr={pr}
            currentSessionId={sessionId}
          />
        )}
      </div>

      {/* Sticky bottom bar (Actuel only) */}
      {view === "current" && (
        <div className="absolute inset-x-0 bottom-0 z-10 border-t border-primary/10 bg-background/85 px-4 pt-3 pb-5 backdrop-blur-xl">
          <button
            onClick={handleValidate}
            disabled={kg < 0 || reps <= 0}
            className="glow-orange flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-orange-intense text-sm font-black tracking-tight text-black disabled:opacity-40 disabled:shadow-none"
          >
            <Check className="size-4" strokeWidth={3} />
            Valider {kg} kg × {reps}
          </button>
        </div>
      )}

      {/* Manual entry modal */}
      {manualOpen && (
        <ManualEntry
          initialKg={kg}
          initialReps={reps}
          onClose={() => setManualOpen(false)}
          onSubmit={(newKg, newReps) => {
            setOverrideKg(newKg);
            setOverrideReps(newReps);
            setManualOpen(false);
          }}
        />
      )}
    </div>
  );
}

interface CurrentViewProps {
  name: string;
  muscleGroup: string | null;
  exerciseIndex: number;
  totalExercises: number;
  activeSetNumber: number;
  targetSets: number;
  kg: number;
  reps: number;
  setKg: (v: number) => void;
  setReps: (v: number) => void;
  edited: boolean;
  step: number | null;
  last: { kg: number; reps: number } | null;
  pr: { kg: number; reps: number; date: string } | null;
  onManualOpen: () => void;
  onReset: () => void;
  currentSets: ExerciseSet[];
  onDeleteSet: (id: number) => void;
  restOpen: boolean;
  restTotal: number;
  restLeft: number;
  onStartRest: (s: number) => void;
  onStopRest: () => void;
  onAdjustRest: (delta: number) => void;
}

function CurrentView({
  name,
  muscleGroup,
  exerciseIndex,
  totalExercises,
  activeSetNumber,
  targetSets,
  kg,
  reps,
  setKg,
  setReps,
  edited,
  step,
  last,
  pr,
  onManualOpen,
  onReset,
  currentSets,
  onDeleteSet,
  restOpen,
  restTotal,
  restLeft,
  onStartRest,
  onStopRest,
  onAdjustRest,
}: CurrentViewProps) {
  const isNewPr =
    pr && (kg > pr.kg || (kg === pr.kg && reps > pr.reps));
  const matchesPr = pr && kg === pr.kg && reps === pr.reps;

  return (
    <>
      {/* Title */}
      <div className="mb-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary/60">
          Exercice {exerciseIndex}/{totalExercises} · Série {activeSetNumber}/{targetSets}
        </p>
        <h1 className="mt-1.5 text-xl font-black tracking-tight">{name}</h1>
        {muscleGroup && (
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">
            {muscleGroup}
          </p>
        )}
      </div>

      {/* Personal stats ribbon */}
      <div className="mb-4 flex gap-px overflow-hidden rounded-xl bg-border">
        <MiniStat label="Dernière" value={last ? `${last.kg} × ${last.reps}` : "—"} />
        <MiniStat
          label="PR perso"
          value={pr ? `${pr.kg} × ${pr.reps}` : "—"}
          tone="gold"
        />
      </div>

      {/* Huge input card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-4 pt-6 pb-4">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(var(--accent-l) var(--accent-c) var(--accent-h) / 0.18), transparent)",
          }}
        />

        <div className="relative text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Poids (kg)
          </p>
          <BigDial
            value={kg}
            onChange={setKg}
            step={step}
            onTapValue={onManualOpen}
          />
        </div>

        <div className="-mx-4 my-5 h-px bg-border" />

        <div className="relative text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Répétitions
          </p>
          <BigDial
            value={reps}
            onChange={setReps}
            step={1}
            onTapValue={onManualOpen}
          />
        </div>

        {/* Source indicator */}
        <div
          className={`relative mt-4 flex items-center gap-2 rounded-lg px-3 py-2 ${
            edited
              ? "bg-secondary/40"
              : "bg-primary/[0.08]"
          }`}
        >
          {edited ? (
            <Pencil className="size-3 shrink-0 text-muted-foreground" />
          ) : (
            <Sparkles className="size-3 shrink-0 text-primary" />
          )}
          <p
            className={`flex-1 text-[10px] font-semibold leading-snug ${
              edited ? "text-muted-foreground" : "text-primary"
            }`}
          >
            {edited
              ? "Modifié — touche la valeur pour éditer"
              : step && last
              ? `Pré-rempli : ta dernière (${last.kg}×${last.reps}) · pas de ${step}kg`
              : last
              ? `Pré-rempli depuis ta dernière (${last.kg}×${last.reps})`
              : "Aucun historique — touche le chiffre pour saisir"}
          </p>
          {edited && (
            <button
              onClick={onReset}
              className="shrink-0 text-[10px] font-black uppercase tracking-wider text-primary"
            >
              Reset
            </button>
          )}
        </div>

        {/* Live PR feedback */}
        {pr && (
          <div
            className="relative mt-2.5 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5"
            style={{
              background: "color-mix(in oklch, #eab308 10%, transparent)",
            }}
          >
            <Trophy className="size-3.5" style={{ color: "#eab308" }} />
            <p
              className="text-[11px] font-bold leading-tight"
              style={{ color: "#eab308" }}
            >
              {isNewPr
                ? "NEW PR ! Tu exploses ton record."
                : matchesPr
                ? `Tu matches ton PR (${pr.kg}kg × ${pr.reps})`
                : kg >= pr.kg
                ? `${pr.reps - reps > 0 ? `${pr.reps - reps} rep de ton PR` : `À ${pr.kg}kg, vise ${pr.reps + 1} reps`}`
                : `${(pr.kg - kg).toFixed(1)} kg de ton PR (${pr.kg}×${pr.reps})`}
            </p>
          </div>
        )}
      </div>

      {/* Current session set chips */}
      <div className="mt-4 flex gap-1.5">
        {Array.from({ length: targetSets }).map((_, i) => {
          const setData = currentSets[i];
          const isActive = i === currentSets.length;
          return (
            <SetChip
              key={i}
              n={i + 1}
              kg={setData?.weightKg ?? (isActive ? kg : undefined)}
              reps={setData?.reps ?? (isActive ? reps : undefined)}
              done={!!setData}
              active={isActive && !setData}
              onDelete={setData ? () => onDeleteSet(setData.id) : undefined}
            />
          );
        })}
      </div>

      {/* Rest timer */}
      <div className="mt-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Repos
        </p>
        {!restOpen ? (
          <div className="grid grid-cols-4 gap-1.5">
            {PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => onStartRest(s)}
                className="flex h-16 items-center justify-center rounded-2xl border border-border bg-card text-base font-black tracking-tight transition-colors active:scale-95 hover:border-primary/40"
              >
                {formatPreset(s)}
              </button>
            ))}
          </div>
        ) : (
          <RestRunning
            total={restTotal}
            left={restLeft}
            onStop={onStopRest}
            onAdjust={onAdjustRest}
          />
        )}
      </div>

      <div className="h-6" />
    </>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "gold";
}) {
  const goldBg =
    tone === "gold"
      ? "color-mix(in oklch, #eab308 10%, var(--card))"
      : "var(--card)";
  return (
    <div
      className="flex-1 py-2.5 text-center"
      style={{ background: goldBg }}
    >
      <div
        className="text-[9px] font-bold uppercase tracking-[0.14em]"
        style={{
          color: tone === "gold" ? "#eab308" : "var(--muted-foreground)",
        }}
      >
        {label}
      </div>
      <div className="mt-1 text-[13px] font-black tracking-tight">{value}</div>
    </div>
  );
}

function BigDial({
  value,
  onChange,
  step,
  onTapValue,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number | null;
  onTapValue: () => void;
}) {
  const noStep = !step;
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => !noStep && onChange(Math.max(0, +(value - (step ?? 0)).toFixed(2)))}
        disabled={noStep}
        className="flex size-[52px] shrink-0 items-center justify-center rounded-full border border-border bg-secondary/60 text-foreground transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Diminuer"
      >
        <Minus className="size-5" strokeWidth={3} />
      </button>
      <button
        onClick={onTapValue}
        className="text-gradient-orange min-w-[120px] shrink-0 border-0 px-2 text-6xl font-black leading-none tracking-[-0.05em]"
      >
        {value}
      </button>
      <button
        onClick={() => !noStep && onChange(+(value + (step ?? 0)).toFixed(2))}
        disabled={noStep}
        className="flex size-[52px] shrink-0 items-center justify-center rounded-full text-black transition-transform active:scale-95 disabled:cursor-not-allowed disabled:border disabled:border-border disabled:bg-secondary/60 disabled:text-muted-foreground disabled:opacity-40"
        style={
          noStep
            ? undefined
            : {
                background: "linear-gradient(135deg,#ff8a3d,#e84a00)",
                boxShadow: "0 0 20px oklch(0.72 0.21 48 / 0.3)",
              }
        }
        aria-label="Augmenter"
      >
        <Plus className="size-5" strokeWidth={3.5} />
      </button>
    </div>
  );
}

function SetChip({
  n,
  kg,
  reps,
  done,
  active,
  onDelete,
}: {
  n: number;
  kg?: number;
  reps?: number;
  done: boolean;
  active: boolean;
  onDelete?: () => void;
}) {
  const hasValue = kg != null && reps != null;
  return (
    <div
      className={`relative flex-1 rounded-xl px-1 py-2 text-center ${
        active
          ? "border border-primary/40 bg-primary/[0.12]"
          : done
          ? "border border-border bg-card"
          : "border border-border bg-card/50 opacity-60"
      }`}
    >
      <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Série {n}
      </div>
      {hasValue ? (
        <div
          className={`mt-1 text-xs font-black tracking-tight ${
            active ? "text-primary" : "text-foreground"
          }`}
        >
          {kg}
          <span className="font-bold text-muted-foreground">×</span>
          {reps}
        </div>
      ) : (
        <div className="mt-1 text-xs font-black text-muted-foreground">—</div>
      )}
      {done && onDelete && (
        <button
          onClick={onDelete}
          className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive/80 text-black/80 transition-transform active:scale-95"
          aria-label="Supprimer"
        >
          <X className="size-2.5" strokeWidth={3} />
        </button>
      )}
    </div>
  );
}

function RestRunning({
  total,
  left,
  onStop,
  onAdjust,
}: {
  total: number;
  left: number;
  onStop: () => void;
  onAdjust: (delta: number) => void;
}) {
  const C = 2 * Math.PI * 28;
  const offset = C * (1 - Math.min(1, left / total));
  const mm = Math.floor(left / 60);
  const ss = String(Math.floor(left % 60)).padStart(2, "0");
  return (
    <div
      className="rounded-2xl border border-transparent p-4"
      style={{
        background:
          "linear-gradient(var(--card), var(--card)) padding-box, linear-gradient(135deg, oklch(0.72 0.21 48 / 0.6), oklch(0.72 0.21 48 / 0.15)) border-box",
      }}
    >
      <div className="mb-3 flex items-center gap-4">
        <svg width={68} height={68} viewBox="0 0 68 68" className="shrink-0">
          <circle
            cx="34"
            cy="34"
            r="28"
            fill="none"
            stroke="var(--border)"
            strokeWidth="5"
          />
          <circle
            cx="34"
            cy="34"
            r="28"
            fill="none"
            stroke="url(#rr2)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            transform="rotate(-90 34 34)"
            style={{ transition: "stroke-dashoffset 300ms linear" }}
          />
          <defs>
            <linearGradient id="rr2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff8a3d" />
              <stop offset="1" stopColor="#e84a00" />
            </linearGradient>
          </defs>
          <text
            x="34"
            y="39"
            textAnchor="middle"
            fill="currentColor"
            className="font-black"
            style={{ font: "900 16px/1 var(--font-sans)", letterSpacing: "-0.04em" }}
          >
            {mm}:{ss}
          </text>
        </svg>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            Récup en cours
          </p>
          <p className="mt-1 text-xs font-bold text-muted-foreground">
            Prépare la prochaine série
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={() => onAdjust(-15)}
          className="h-12 rounded-xl border border-border bg-secondary/60 text-sm font-black text-foreground transition-transform active:scale-95"
        >
          –15s
        </button>
        <button
          onClick={() => onAdjust(15)}
          className="h-12 rounded-xl border border-border bg-secondary/60 text-sm font-black text-foreground transition-transform active:scale-95"
        >
          +15s
        </button>
        <button
          onClick={onStop}
          className="h-12 rounded-xl border border-primary/30 bg-primary/10 text-sm font-black text-primary transition-transform active:scale-95"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

function ManualEntry({
  initialKg,
  initialReps,
  onClose,
  onSubmit,
}: {
  initialKg: number;
  initialReps: number;
  onClose: () => void;
  onSubmit: (kg: number, reps: number) => void;
}) {
  const [k, setK] = useState(String(initialKg));
  const [r, setR] = useState(String(initialReps));
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center px-5"
      style={{
        background: "rgba(0,0,0,.7)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border p-5"
        style={{
          background: "var(--card)",
          borderColor: "color-mix(in oklch, var(--primary) 30%, transparent)",
        }}
      >
        <div className="mb-3.5 text-base font-black tracking-tight">
          Saisie manuelle
        </div>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Poids (kg)
            </p>
            <input
              type="number"
              step="0.5"
              value={k}
              onChange={(e) => setK(e.target.value)}
              autoFocus
              className="h-[52px] w-full rounded-xl border border-border bg-background/60 px-3.5 text-center text-2xl font-black tracking-[-0.03em] text-foreground focus:border-primary/40 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Reps
            </p>
            <input
              type="number"
              value={r}
              onChange={(e) => setR(e.target.value)}
              className="h-[52px] w-full rounded-xl border border-border bg-background/60 px-3.5 text-center text-2xl font-black tracking-[-0.03em] text-foreground focus:border-primary/40 focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl border border-border bg-secondary/60 text-sm font-black text-foreground transition-transform active:scale-95"
          >
            Annuler
          </button>
          <button
            onClick={() => onSubmit(parseFloat(k) || 0, parseInt(r) || 0)}
            className="glow-orange flex h-12 flex-[1.3] items-center justify-center gap-2 rounded-2xl bg-gradient-orange-intense text-sm font-black tracking-tight text-black"
          >
            <Check className="size-4" strokeWidth={3} />
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

interface HistoryViewProps {
  name: string;
  history: HistorySession[] | null;
  pr: { kg: number; reps: number; date: string } | null;
  currentSessionId: number;
}

function HistoryView({ name, history, pr, currentSessionId }: HistoryViewProps) {
  if (history === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  const sorted = [...history].sort((a, b) =>
    a.date < b.date ? 1 : -1
  );
  const sessions = sorted.filter((s) => s.sessionId !== currentSessionId);

  // Build chart points for the progression line (max kg per session).
  // Filter out empty-set sessions defensively — Math.max(...[]) is -Infinity.
  const chartData = [...sessions]
    .reverse()
    .filter((s) => s.sets.length > 0)
    .map((s) => Math.max(...s.sets.map((x) => x.weightKg)));
  const chartMax = chartData.length > 0 ? Math.max(...chartData) : 1;
  const chartMin = chartData.length > 0 ? Math.min(...chartData) : 0;
  const chartRange = chartMax - chartMin || 1;

  return (
    <>
      <div className="mb-4 text-center">
        <h1 className="text-lg font-black tracking-tight">{name}</h1>
        <p className="mt-1 text-[11px] font-medium text-muted-foreground">
          {sessions.length} séance{sessions.length !== 1 ? "s" : ""} · progression
        </p>
      </div>

      {pr && (
        <div className="card-gradient-border mb-4 rounded-2xl p-3.5">
          <div className="mb-2 flex items-baseline gap-1.5">
            <span className="text-gradient-orange text-4xl font-black leading-none tracking-[-0.04em]">
              {pr.kg}
            </span>
            <span className="text-sm font-bold text-muted-foreground">
              kg × {pr.reps}
            </span>
            <span className="flex-1" />
            <span
              className="inline-flex h-[22px] items-center gap-1 rounded-full px-2.5 text-[11px] font-bold"
              style={{
                background: "color-mix(in oklch, #eab308 15%, transparent)",
                color: "#eab308",
              }}
            >
              <Trophy className="size-2.5" />
              PR {formatDate(pr.date)}
            </span>
          </div>
          {chartData.length > 0 && (
            <svg
              width="100%"
              height="54"
              viewBox="0 0 300 54"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="h3area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FE6B00" stopOpacity="0.4" />
                  <stop offset="1" stopColor="#FE6B00" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const n = chartData.length;
                const points = chartData.map((v, i) => {
                  const x = n === 1 ? 150 : (i / (n - 1)) * 300;
                  const y = 10 + (1 - (v - chartMin) / chartRange) * 34;
                  return { x, y };
                });
                const line = points
                  .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                  .join(" ");
                const area = `${line} L ${points[points.length - 1].x} 54 L ${points[0].x} 54 Z`;
                return (
                  <>
                    <path d={area} fill="url(#h3area)" />
                    <path
                      d={line}
                      fill="none"
                      stroke="#FE6B00"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx={points[points.length - 1].x}
                      cy={points[points.length - 1].y}
                      r="4"
                      fill="#FE6B00"
                    />
                  </>
                );
              })()}
            </svg>
          )}
        </div>
      )}

      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Séances complètes
      </p>
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <HistoryIcon className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            Aucun historique pour cet exercice
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sessions.map((s) => {
            const totalVol = s.sets.reduce(
              (a, x) => a + x.weightKg * x.reps,
              0
            );
            const top = s.sets.length > 0
              ? Math.max(...s.sets.map((x) => x.weightKg))
              : 0;
            const isPrSession = pr && s.date === pr.date && top === pr.kg;
            return (
              <div
                key={s.sessionId}
                className="card-gradient-border rounded-2xl p-3.5"
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black capitalize tracking-tight">
                      {formatDate(s.date)}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
                      {s.sets.length} série{s.sets.length !== 1 ? "s" : ""} · {Math.round(totalVol)} kg vol.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black tracking-[-0.03em] text-primary">
                      {top}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      Top kg
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {s.sets.map((set) => {
                    const isPrSet = isPrSession && set.weightKg === pr.kg && set.reps === pr.reps;
                    return (
                      <div
                        key={set.setNumber}
                        className="flex items-center gap-2 rounded-lg bg-secondary/30 px-2.5 py-1.5"
                      >
                        <div className="flex size-[18px] items-center justify-center rounded-full bg-primary/15 text-[9px] font-black text-primary">
                          {set.setNumber}
                        </div>
                        <div className="flex flex-1 items-center justify-center gap-2">
                          <span className="text-[13px] font-black">
                            {set.weightKg} kg
                          </span>
                          <span className="font-bold text-primary/40">×</span>
                          <span className="text-xs font-bold">{set.reps}</span>
                        </div>
                        {isPrSet && (
                          <span
                            className="inline-flex h-4 items-center gap-0.5 rounded-full px-1.5 text-[8px] font-bold"
                            style={{
                              background:
                                "color-mix(in oklch, #eab308 15%, transparent)",
                              color: "#eab308",
                            }}
                          >
                            PR
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="h-6" />
    </>
  );
}
