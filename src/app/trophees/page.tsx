"use client";

import { BackButton } from "@/components/back-button";
import { Spinner } from "@/components/spinner";
import { useTrophies, type TrophyEntry } from "@/components/trophies-provider";

// ── Les médaillons ──────────────────────────────────────────────────────────
// L'icône vient de la famille, le métal vient du grade : plus on monte dans
// une échelle, plus le médaillon devient précieux.

import { Medallion, TROPHY_FAMILIES, trophyStatOf } from "@/components/trophy-medallion";
import { Trophy } from "@/components/icons";

// L'ordre des familles de la Salle.
const FAMILIES: { stat: string; label: string }[] = [
  "sessions", "records", "maxWeight", "tonnage", "sets", "exercises",
  "streakWeeks", "bestWeek", "cardioMinutes", "cardsOwned",
].map((stat) => ({ stat, label: TROPHY_FAMILIES[stat].label }));

// Le Cabinet des Trophées : tout est public — la cible, la progression,
// la récompense. On sait toujours pourquoi on pousse.
export default function TrophiesPage() {
  const { loaded, trophies } = useTrophies();

  if (!loaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const earnedCount = trophies.filter((t) => t.earned).length;

  return (
    <div className="min-h-dvh px-4 pb-12 pt-6">
      <BackButton />

      <header className="mb-6 mt-3">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">
          Le mérite
        </p>
        <h1 className="mt-1 text-3xl tracking-tighter">Trophées</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gagnés à la sueur, jamais au tirage. Les plus grands déverrouillent
          des morceaux de l&apos;appli.
        </p>
      </header>

      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-secondary/30 px-4 py-3 ring-1 ring-border">
        <Trophy className="size-5 text-yellow-400" />
        <p className="text-sm font-bold">
          <span className="font-mono tabular-nums text-primary">{earnedCount}</span>
          <span className="text-muted-foreground"> / {trophies.length} au cabinet</span>
        </p>
      </div>

      <div className="space-y-7">
        {FAMILIES.map(({ stat, label }) => {
          const group = trophies
            .filter((t) => trophyStatOf(t.id) === stat)
            .sort((a, b) => a.target - b.target);
          if (group.length === 0) return null;
          const groupEarned = group.filter((t) => t.earned).length;
          return (
            <section key={stat}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-sm uppercase tracking-[0.2em] text-primary/70">{label}</h2>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {groupEarned}/{group.length}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2.5">
                {group.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl px-4 py-3 ring-1 ${
              t.earned
                ? "bg-yellow-500/5 ring-yellow-500/30"
                : "bg-secondary/20 ring-border"
            }`}
          >
            <div className="flex items-center gap-3">
              <Medallion entry={t} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-black tracking-tight ${t.earned ? "text-yellow-200" : ""}`}>
                  {t.name}
                </p>
                <p className="text-[11px] leading-snug text-muted-foreground">{t.description}</p>
              </div>
              <span className="shrink-0 font-mono text-[11px] font-black tabular-nums text-muted-foreground">
                {t.progress >= 1000 ? `${Math.round(t.progress / 1000)}k` : t.progress}
                /{t.target >= 1000 ? `${Math.round(t.target / 1000)}k` : t.target}
              </span>
            </div>
            {!t.earned && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary/50">
                <div
                  className="h-full rounded-full bg-gradient-orange"
                  style={{ width: `${Math.min(100, (t.progress / t.target) * 100)}%` }}
                />
              </div>
            )}
            <p className={`mt-1.5 text-[11px] leading-snug ${t.earned ? "text-yellow-200/80" : "text-muted-foreground/70"}`}>
              {t.rewardLabel}
            </p>
          </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
