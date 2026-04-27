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

export function resolveMuscleGroups(
  muscleGroups: string[] | null | undefined,
  muscleGroup: string | null | undefined,
): string[] {
  if (muscleGroups && muscleGroups.length > 0) return muscleGroups;
  if (muscleGroup) return [muscleGroup];
  return [];
}
