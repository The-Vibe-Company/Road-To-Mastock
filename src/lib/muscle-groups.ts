export const MUSCLE_GROUPS = [
  "Pectoraux",
  "Dos",
  "Épaules",
  "Biceps",
  "Triceps",
  "Quadriceps",
  "Ischio-jambiers",
  "Fessiers",
  "Mollets",
  "Abdominaux",
  "Cardio",
] as const;

function clean(values: Iterable<string | null | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export function resolveMuscleGroups(
  muscleGroups: string[] | null | undefined,
  muscleGroup: string | null | undefined,
): string[] {
  const fromArray = clean(muscleGroups ?? []);
  if (fromArray.length > 0) return fromArray;
  return clean([muscleGroup]);
}
