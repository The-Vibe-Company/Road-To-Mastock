"use client";

interface SetRowProps {
  setNumber: number;
  weightKg: number;
  reps: number;
  onDelete?: () => void;
}

export function SetRow({ setNumber, weightKg, reps, onDelete }: SetRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <div className="flex items-center gap-3">
        <span className="w-6 text-center text-xs font-medium text-zinc-400">
          {setNumber}
        </span>
        <span className="font-medium">{weightKg} kg</span>
        <span className="text-zinc-400">x</span>
        <span className="font-medium">{reps} reps</span>
      </div>
      {onDelete && (
        <button
          onClick={onDelete}
          className="px-2 py-1 text-xs text-red-500 active:text-red-700"
        >
          Suppr.
        </button>
      )}
    </div>
  );
}
