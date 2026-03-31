import Link from "next/link";
import { ChevronRight, Flame, Weight, Trophy } from "lucide-react";

interface SessionCardProps {
  id: number;
  date: string;
  exerciseCount: number;
  totalVolume: number;
  gold: number;
  silver: number;
  bronze: number;
}

export function SessionCard({ id, date, exerciseCount, totalVolume, gold, silver, bronze }: SessionCardProps) {
  const d = new Date(date);
  const formatted = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Link href={`/sessions/${id}`} className="block">
      <div className="card-hover flex items-center gap-3 rounded-xl border-l-2 border-l-primary/60 bg-card px-4 py-4 ring-1 ring-foreground/10 transition-colors hover:bg-accent/60">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Flame className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-bold capitalize">{formatted}</p>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{exerciseCount} exercice{exerciseCount !== 1 ? "s" : ""}</span>
            {totalVolume > 0 && (
              <span className="flex items-center gap-1 font-bold text-primary">
                <Weight className="size-3" />
                {totalVolume >= 1000
                  ? `${(totalVolume / 1000).toFixed(1)}t`
                  : `${totalVolume} kg`}
              </span>
            )}
            {(gold > 0 || silver > 0 || bronze > 0) && (
              <span className="flex items-center gap-1.5">
                {gold > 0 && (
                  <span className="flex items-center gap-0.5 font-bold text-yellow-500">
                    <Trophy className="size-3" />{gold}
                  </span>
                )}
                {silver > 0 && (
                  <span className="flex items-center gap-0.5 font-bold text-gray-400">
                    <Trophy className="size-3" />{silver}
                  </span>
                )}
                {bronze > 0 && (
                  <span className="flex items-center gap-0.5 font-bold text-amber-700">
                    <Trophy className="size-3" />{bronze}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="size-4 text-primary/40" />
      </div>
    </Link>
  );
}
