import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";

interface SessionCardProps {
  id: number;
  date: string;
  exerciseCount: number;
}

export function SessionCard({ id, date, exerciseCount }: SessionCardProps) {
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
          <p className="text-xs text-muted-foreground">
            {exerciseCount} exercice{exerciseCount !== 1 ? "s" : ""}
          </p>
        </div>
        <ChevronRight className="size-4 text-primary/40" />
      </div>
    </Link>
  );
}
