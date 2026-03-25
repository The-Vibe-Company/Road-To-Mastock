import Link from "next/link";

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
    <Link
      href={`/sessions/${id}`}
      className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 active:bg-zinc-50"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium capitalize">{formatted}</p>
          <p className="text-sm text-zinc-500">
            {exerciseCount} exercice{exerciseCount !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="text-zinc-300">&rsaquo;</span>
      </div>
    </Link>
  );
}
