export type CardioMachine = "treadmill" | "bike" | "elliptical" | "rower";

export const CARDIO_MACHINES: { slug: CardioMachine; label: string }[] = [
  { slug: "treadmill", label: "Tapis de course" },
  { slug: "bike", label: "Vélo" },
  { slug: "elliptical", label: "Vélo elliptique" },
  { slug: "rower", label: "Rameur" },
];

export function cardioMachineFromName(name: string): CardioMachine | null {
  const m = CARDIO_MACHINES.find((c) => c.label.toLowerCase() === name.toLowerCase());
  return m?.slug ?? null;
}

export function cardioLabel(slug: CardioMachine): string {
  return CARDIO_MACHINES.find((c) => c.slug === slug)?.label ?? slug;
}

// Which fields each machine surfaces (calories is always optional, duration is required).
export const cardioFields: Record<
  CardioMachine,
  { distance: boolean; avgSpeed: boolean; resistance: boolean }
> = {
  treadmill: { distance: true, avgSpeed: true, resistance: false },
  bike: { distance: true, avgSpeed: false, resistance: false },
  elliptical: { distance: false, avgSpeed: false, resistance: true },
  rower: { distance: false, avgSpeed: false, resistance: true },
};
