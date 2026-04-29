"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpinResponse {
  reward: 1 | 2 | 3 | 4;
  tokens: number;
  specialTokens: number;
}

const SEGMENTS = [
  { reward: 1, weight: 20, color: "#52525b", label: "×1" },
  { reward: 2, weight: 60, color: "#10b981", label: "×2" },
  { reward: 3, weight: 19, color: "#a855f7", label: "×3" },
  { reward: 4, weight: 1,  color: "#f43f5e", label: "★4" },
] as const;

// Pre-compute angular ranges (clockwise from 12 o'clock)
const SEGMENT_ARCS = (() => {
  let start = 0;
  return SEGMENTS.map((s) => {
    const arc = (s.weight / 100) * 360;
    const range = { start, end: start + arc, mid: start + arc / 2 };
    start += arc;
    return { ...s, ...range };
  });
})();

function arcPath(startDeg: number, endDeg: number, r: number, cx = 100, cy = 100): string {
  const startRad = ((startDeg - 90) * Math.PI) / 180;
  const endRad = ((endDeg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export function SpinWheelModal({
  onClose,
  onAfterSpin,
}: {
  onClose: () => void;
  onAfterSpin?: () => void;
}) {
  const [stage, setStage] = useState<"idle" | "spinning" | "result">("idle");
  const [angle, setAngle] = useState(0);
  const [result, setResult] = useState<1 | 2 | 3 | 4 | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSpin = async () => {
    if (stage !== "idle") return;
    setStage("spinning");
    setError(null);
    try {
      const r = await fetch("/api/cards/spin", { method: "POST" });
      if (!r.ok) {
        const e = await r.json();
        setError(e.error || "Erreur");
        setStage("idle");
        return;
      }
      const data: SpinResponse = await r.json();
      const arc = SEGMENT_ARCS.find((s) => s.reward === data.reward)!;
      // Target rotation: 6 full rotations + offset to land on the result's mid angle.
      // Add a tiny random jitter (±arc/4) so the wheel doesn't always land dead center.
      const jitter = (Math.random() - 0.5) * (arc.end - arc.start) * 0.5;
      const targetAngle = 360 * 6 + (360 - arc.mid - jitter);
      setAngle(targetAngle);
      setResult(data.reward);
      setTimeout(() => {
        setStage("result");
        onAfterSpin?.();
      }, 3300);
    } catch {
      setError("Erreur réseau");
      setStage("idle");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-xl bg-secondary/60 text-muted-foreground backdrop-blur transition-colors hover:text-primary"
      >
        <X className="size-5" />
      </button>

      <div className="flex w-full max-w-sm flex-col items-center gap-6 px-6">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-300/80">
            Jeton spécial
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tighter">Tourne la roue</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Convertit ton jeton spécial en 1 à 4 jetons normaux
          </p>
        </div>

        <div className="relative size-72">
          {/* Outer glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/20 via-transparent to-transparent blur-2xl" />

          {/* Pointer */}
          <div
            className="absolute left-1/2 top-0 z-10 size-0 -translate-x-1/2 -translate-y-1"
            style={{
              borderLeft: "14px solid transparent",
              borderRight: "14px solid transparent",
              borderTop: "26px solid #fbbf24",
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
            }}
          />

          <svg
            viewBox="0 0 200 200"
            className="size-full"
            style={{
              transform: `rotate(${angle}deg)`,
              transition:
                stage === "spinning"
                  ? "transform 3.2s cubic-bezier(0.15, 0.85, 0.2, 1)"
                  : "none",
            }}
          >
            {SEGMENT_ARCS.map((seg) => {
              const labelRad = ((seg.mid - 90) * Math.PI) / 180;
              const labelR = seg.reward === 4 ? 78 : 60;
              const lx = 100 + labelR * Math.cos(labelRad);
              const ly = 100 + labelR * Math.sin(labelRad);
              return (
                <g key={seg.reward}>
                  <path
                    d={arcPath(seg.start, seg.end, 95)}
                    fill={seg.color}
                    stroke="#0a0a0a"
                    strokeWidth="1.5"
                  />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={seg.reward === 4 ? 11 : 20}
                    fontWeight="900"
                    transform={`rotate(${seg.mid}, ${lx}, ${ly})`}
                    style={{ pointerEvents: "none" }}
                  >
                    {seg.label}
                  </text>
                </g>
              );
            })}
            {/* Hub */}
            <circle cx="100" cy="100" r="18" fill="#0a0a0a" stroke="#fbbf24" strokeWidth="3" />
            <circle cx="100" cy="100" r="6" fill="#fbbf24" />
          </svg>
        </div>

        {stage === "result" && result !== null && (
          <div className="text-center animate-card-reveal">
            <p
              className={`text-6xl font-black tracking-tighter ${
                result >= 3 ? "text-rose-300" : result === 2 ? "text-emerald-300" : "text-zinc-200"
              }`}
            >
              ×{result}
            </p>
            <p className="mt-2 text-sm font-bold text-foreground">
              jeton{result > 1 ? "s" : ""} ajouté{result > 1 ? "s" : ""} à ton compte
              {result === 4 && " — JACKPOT !"}
            </p>
          </div>
        )}

        {error && <p className="text-sm font-bold text-destructive">{error}</p>}

        <Button
          onClick={stage === "result" ? onClose : handleSpin}
          disabled={stage === "spinning"}
          className="h-12 w-full rounded-2xl bg-gradient-orange-intense text-base font-black uppercase tracking-wider text-black disabled:opacity-100"
        >
          {stage === "idle" && (
            <>
              <Sparkles className="size-4" strokeWidth={3} />
              Tourner la roue
            </>
          )}
          {stage === "spinning" && "Roule..."}
          {stage === "result" && "Continuer"}
        </Button>
      </div>
    </div>
  );
}
