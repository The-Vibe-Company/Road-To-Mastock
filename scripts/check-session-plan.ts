/**
 * Contrôle de la logique de programme de séance (src/lib/session-plan.ts).
 *
 * Le repo n'a pas de harnais de test : ce script joue le même rôle pour la
 * seule partie vraiment subtile du calcul — alternance des motifs, décalage de
 * palier, plafonnement, et ancrage sur un poids hors paliers.
 *
 *   pnpm check:plan
 */
import { computeSessionPlan, type SessionPlan } from "../src/lib/session-plan";

type LoggedSet = { weightKg: number; reps: number };
const sets = (weights: number[], reps: number[]): LoggedSet[] =>
  weights.map((w, i) => ({ weightKg: w, reps: reps[i] }));
/** Séance bouclée : toutes les séries au nombre de reps cible. */
const full = (weights: number[]): LoggedSet[] =>
  weights.map((w) => ({ weightKg: w, reps: 10 }));

let failures = 0;

function check(
  label: string,
  steps: number[],
  last: LoggedSet[] | null,
  expected: Partial<SessionPlan> | null,
) {
  const plan = computeSessionPlan(steps, last);
  const mismatch: string[] = [];

  if (expected === null) {
    if (plan !== null) mismatch.push("un plan a été produit alors qu'aucun n'était attendu");
  } else if (plan === null) {
    mismatch.push("aucun plan produit");
  } else {
    if (expected.weights && plan.weights.join(",") !== expected.weights.join(","))
      mismatch.push(`poids ${plan.weights.join(",")} au lieu de ${expected.weights.join(",")}`);
    for (const key of ["pattern", "shifted", "atCeiling"] as const) {
      if (expected[key] !== undefined && plan[key] !== expected[key])
        mismatch.push(`${key} = ${plan[key]} au lieu de ${expected[key]}`);
    }
  }

  if (mismatch.length === 0) {
    console.log(`  ok   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}`);
    for (const m of mismatch) console.log(`       ${m}`);
  }
}

const P = [32, 39, 45, 52, 59, 66, 73];

console.log("Programme de séance\n");

console.log(" motifs et alternance");
check("sans historique : montée depuis le premier palier", P, null,
  { weights: [32, 39, 45, 52, 59], pattern: "ascendant", shifted: false, atCeiling: false });
check("après une montée : pyramide", P, sets([32, 39, 45, 52, 59], [10, 10, 10, 8, 6]),
  { weights: [32, 39, 59, 52, 45], pattern: "pyramide", shifted: false });
check("après une pyramide : montée", P, sets([32, 39, 59, 52, 45], [10, 10, 8, 8, 8]),
  { weights: [32, 39, 45, 52, 59], pattern: "ascendant", shifted: false });
check("séance plate : comptée comme montée, donc pyramide ensuite", P,
  sets([39, 39, 39, 39, 39], [8, 8, 8, 8, 8]), { pattern: "pyramide" });
check("montée finie plus léger (fatigue) : la redescente vaut pyramide", P,
  sets([32, 39, 45, 52, 45], [8, 8, 8, 8, 8]), { pattern: "ascendant" });

console.log("\n décalage de palier");
check("toutes les séries à 10 reps : le départ monte d'un cran", P, full([32, 39, 59, 52, 45]),
  { weights: [39, 45, 52, 59, 66], pattern: "ascendant", shifted: true, atCeiling: false });
check("au-delà de 10 reps, séance bouclée aussi", P, sets([32, 39, 45, 52, 59], [12, 12, 11, 10, 10]),
  { weights: [39, 45, 66, 59, 52], pattern: "pyramide", shifted: true });
check("une seule série sous la cible : pas de décalage", P, sets([32, 39, 45, 52, 59], [10, 10, 10, 10, 9]),
  { shifted: false });

console.log("\n plafond");
check("près du sommet : le programme raccourcit au lieu de redescendre",
  P, full([59, 66, 73, 66, 59]),
  { weights: [52, 59, 66, 73], shifted: true, atCeiling: true });
check("plafond : on n'annonce pas un décalage annulé par le clamp",
  P, full([59, 66, 73]),
  { weights: [59, 73, 66], shifted: false, atCeiling: true });
check("le raccourcissement est annoncé dès qu'il a lieu",
  [32, 39, 45, 52, 59], full([32, 39, 45, 52, 59]),
  { weights: [39, 45, 59, 52], shifted: true, atCeiling: true });

console.log("\n ancrage");
// 41 est entre 39 et 45, le plus proche est 39. Un arrondi au palier supérieur
// ancrerait sur 45 et donnerait 45,52,73,66,59.
check("poids hors paliers : on ancre sur le plus proche, pas le suivant",
  P, sets([41], [8]), { weights: [39, 45, 66, 59, 52], pattern: "pyramide" });
// Ancré sur le plus léger, l'échauffement à 32 ramènerait le plan à 32,39,45,52,59
// alors que les séries de travail étaient à 59-66.
check("une série d'échauffement ne tire pas le programme vers le bas",
  P, sets([32, 59, 66, 59], [3, 8, 8, 8]), { weights: [45, 52, 59, 66, 73] });
// Sans le filtre sur les reps, le single à 73 ancrerait le plan sur 52,59,73,66.
check("un single de force isolé ne tire pas le programme vers le haut",
  P, sets([45, 52, 59, 73], [10, 10, 10, 1]),
  { weights: [39, 45, 66, 59, 52], atCeiling: false });
check("le programme vise cinq séries quels que soient les usages passés",
  P, sets([32, 39, 45, 52], [10, 9, 8, 8]), { weights: [32, 39, 59, 52, 45] });
check("sur trois paliers seulement, la pyramide se réduit à un cran de montée",
  [32, 39, 45], sets([32, 39, 45], [9, 9, 9]), { weights: [32, 45, 39] });

console.log("\n garde-fous");
check("moins de trois paliers connus : pas de programme", [40, 50], null, null);
check("paliers en désordre ou dupliqués : triés et dédoublonnés",
  [45, 32, 39, 45, 52, 59], null, { weights: [32, 39, 45, 52, 59] });

// Enchaînement de séances toutes bouclées : la progression doit avancer puis
// se déclarer au plafond, jamais se figer en prétendant progresser.
console.log("\n progression sur plusieurs séances");
let current = computeSessionPlan(P, null)!;
const seen: string[] = [`${current.weights.join(",")} (${current.weights.length}s)`];
let simFailures = 0;
for (let i = 0; i < 6; i++) {
  const before = current;
  current = computeSessionPlan(P, full(current.weights))!;
  seen.push(
    `${current.weights.join(",")} (${current.weights.length}s)` +
      `${current.shifted ? " +1" : ""}${current.atCeiling ? " [plafond]" : ""}`,
  );
  if (!current.shifted && !current.atCeiling) {
    simFailures++;
    console.log(`  FAIL séance ${i + 2} : ni progression ni plafond annoncé`);
  }
  // C'est ici que se cachait la régression : le programme perdait des séries
  // sans le dire, et ne les récupérait jamais.
  if (current.weights.length < before.weights.length && !current.atCeiling) {
    simFailures++;
    console.log(
      `  FAIL séance ${i + 2} : ${before.weights.length} -> ${current.weights.length} séries sans annoncer le plafond`,
    );
  }
}
failures += simFailures;
if (simFailures === 0) console.log(`  ok   la progression avance puis se déclare au plafond`);
for (const s of seen) console.log(`         ${s}`);

// Le volume doit repartir dès que de nouveaux paliers sont déclarés.
const WIDER = [...P, 80, 87, 94];
const shrunk = computeSessionPlan(P, full([59, 66, 73]))!;
check("après élargissement des paliers, le volume repart à cinq séries",
  WIDER, full(shrunk.weights), { atCeiling: false });
if (computeSessionPlan(WIDER, full(shrunk.weights))!.weights.length !== 5) {
  failures++;
  console.log("  FAIL le programme reste tronqué malgré de nouveaux paliers");
}

if (failures > 0) {
  console.error(`\n${failures} contrôle(s) en échec`);
  process.exit(1);
}
console.log("\nTous les contrôles passent.");
