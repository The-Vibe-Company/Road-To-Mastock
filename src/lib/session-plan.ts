// Programme de séance pour un exercice de muscu.
//
// Méthode suivie : on travaille sur les paliers de la machine, en alternant
// une séance sur deux entre deux motifs.
//
//   ascendant : paliers 1 2 3 4 5   ->  32 39 45 52 59
//   pyramide  : paliers 1 2 5 4 3   ->  32 39 59 52 45
//
// Et dès qu'une séance est bouclée avec le nombre de reps cible sur **toutes**
// les séries, on décale le point de départ d'un palier pour durcir la suivante.
//
// Tout est déduit de l'historique, il n'y a rien à stocker : le motif du jour
// est l'inverse de celui de la dernière séance, et le palier de départ vient de
// la dernière séance faite.

export type PlanPattern = "ascendant" | "pyramide";

export interface SessionPlan {
  weights: number[];
  pattern: PlanPattern;
  /** Le départ a réellement monté d'un palier par rapport à la dernière séance. */
  shifted: boolean;
  /**
   * Les paliers connus ne suffisent plus : le programme a été raccourci ou son
   * départ ramené vers le bas. Il faut déclarer des paliers pour continuer.
   */
  atCeiling: boolean;
}

export interface PlannedSet {
  weightKg: number;
  reps: number;
}

/** En dessous de 3 paliers connus, un programme n'a pas de sens. */
const MIN_STEPS = 3;
const DEFAULT_SET_COUNT = 5;
export const TARGET_REPS = 10;

/**
 * Ordre des paliers pour la pyramide : deux crans de montée, on va au sommet,
 * puis on redescend. Sur 3 séries la montée se réduit à un seul cran.
 */
function pyramidOrder(count: number): number[] {
  const head = count >= 4 ? [0, 1] : [0];
  const rest: number[] = [];
  for (let i = count - 1; i >= head.length; i--) rest.push(i);
  return [...head, ...rest];
}

function ascendingOrder(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i);
}

/** Palier le plus proche du poids donné. À égalité, on prend le plus léger. */
function nearestStepIndex(steps: number[], target: number): number {
  let best = 0;
  let bestGap = Math.abs(steps[0] - target);
  for (let i = 1; i < steps.length; i++) {
    const gap = Math.abs(steps[i] - target);
    if (gap < bestGap) {
      best = i;
      bestGap = gap;
    }
  }
  return best;
}

export function computeSessionPlan(
  knownWeights: number[],
  lastSets: PlannedSet[] | null | undefined,
): SessionPlan | null {
  const steps = [...new Set(knownWeights)].sort((a, b) => a - b);
  if (steps.length < MIN_STEPS) return null;

  const previous = lastSets && lastSets.length > 0 ? lastSets : null;

  // Toujours cinq séries, raccourci seulement si les paliers manquent.
  //
  // Une première version calquait le volume sur la séance précédente. Mauvaise
  // idée : quand le plafond raccourcissait un programme, ce raccourcissement
  // se retrouvait dans l'historique et devenait permanent — le volume ne
  // remontait jamais, même après avoir déclaré de nouveaux paliers. Et avec un
  // seul historique en entrée, rien ne permet de distinguer « trois séries
  // parce que le plafond a tronqué » de « trois séries par choix ».
  let count = Math.min(DEFAULT_SET_COUNT, steps.length);

  // On alterne. Une pyramide se reconnaît à sa redescente : c'est plus robuste
  // que d'exiger une suite strictement croissante, qui classait « ascendante »
  // toute séance un peu irrégulière et bloquait l'alternance.
  const lastWasPyramid =
    previous !== null &&
    previous.some((s, i) => i > 0 && s.weightKg < previous[i - 1].weightKg);
  const pattern: PlanPattern =
    previous === null ? "ascendant" : lastWasPyramid ? "ascendant" : "pyramide";

  // Palier de départ, déduit de la dernière séance. On ancre sur la série la
  // plus LOURDE et non la plus légère : une série d'échauffement n'est jamais
  // la plus lourde, alors qu'elle tirerait l'ancre basse plusieurs paliers trop
  // bas. On ignore les séries très courtes pour qu'un test de force isolé ne
  // tire pas tout le programme vers le haut. Et on retient le palier le plus
  // proche, pas le premier au-dessus, pour ne pas sauter deux crans après un
  // poids hors paliers.
  let previousBase = 0;
  let allSetsAtTarget = false;
  if (previous) {
    const worked = previous.filter((s) => s.reps >= TARGET_REPS / 2);
    const reference = worked.length > 0 ? worked : previous;
    const heaviest = Math.max(...reference.map((s) => s.weightKg));
    // Reconstruit le départ de la séance précédente avec SON nombre de séries,
    // et non celui du jour : sinon `shifted` compare deux points de référence
    // différents et annonce une progression qui n'a pas eu lieu.
    previousBase = Math.max(
      0,
      nearestStepIndex(steps, heaviest) - (previous.length - 1),
    );
    allSetsAtTarget = previous.every((s) => s.reps >= TARGET_REPS);
  }

  let base = previousBase + (allSetsAtTarget ? 1 : 0);
  let atCeiling = false;

  // Au plafond, on raccourcit le programme plutôt que de le faire redescendre :
  // repartir d'en bas après une séance bouclée en haut serait un recul. La
  // perte de séries est signalée dès qu'elle a lieu.
  if (base + count > steps.length) {
    const room = Math.max(MIN_STEPS, steps.length - base);
    if (room < count) atCeiling = true;
    count = room;
  }
  if (base + count > steps.length) {
    base = Math.max(0, steps.length - count);
    atCeiling = true;
  }

  const order = pattern === "ascendant" ? ascendingOrder(count) : pyramidOrder(count);
  return {
    weights: order.map((i) => steps[base + i]),
    pattern,
    // Après plafonnement, le départ peut ne pas avoir bougé : on ne prétend pas
    // le contraire.
    shifted: previous !== null && base > previousBase,
    atCeiling,
  };
}
