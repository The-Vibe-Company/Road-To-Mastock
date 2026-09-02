// ─── Les Talents cachés ─────────────────────────────────────────────────────
// Deuxième étage du jeu : une élite de cartes porte, en plus de son pouvoir
// de Gardien, un privilège permanent débloqué par la simple possession.
// Règle d'or : un Talent ne touche JAMAIS l'économie (jetons, tickets,
// fragments) — uniquement des privilèges d'appli.
//
// La correspondance carte ↔ talent est un secret de fabrication : rien dans
// l'UI ne signale qu'une carte non possédée porte un talent. Le Grimoire
// n'affiche que des silhouettes.

export type TalentFamily = "parure" | "trone" | "oracle" | "relique" | "etendard";

export interface TalentEffect {
  // "accent" : débloque des couleurs scellées (clés de SEALED_ACCENTS).
  // "alpha"  : débloque la roue chromatique libre (accent custom:<teinte>).
  // "feature" : privilège câblé dans l'UI, activé par la possession (has(id)).
  kind: "accent" | "alpha" | "feature";
  accents?: string[];
}

export interface TalentDef {
  id: string;
  family: TalentFamily;
  name: string;
  description: string;
  effect: TalentEffect;
}

const FEATURE: TalentEffect = { kind: "feature" };

// Clé : `${category}:${slug}`.
export const TALENTS: Record<string, TalentDef> = {
  // ── Auras des 15 bêtes primordiales ──
  "animal:ouroboros":        { id: "cercle-parfait", family: "relique", name: "Le Cercle Parfait",   description: "Le temps s'enroule sur lui-même et se dévore sans fin. Concrètement : ton chrono de repos devient un serpent vert qui se mord la queue, sa tête courant sur l'anneau.", effect: FEATURE },
  "animal:world-serpent":    { id: "serpent-monde", family: "trone",    name: "Le Serpent-Monde",    description: "Il enserre le monde entier, il peut bien enserrer ta home. Concrètement : débloque un fond d'écran pour la page d'accueil, à activer dans Réglages → Trônes.", effect: FEATURE },
  "animal:fenrir":           { id: "ragnarok",      family: "parure",   name: "Ragnarök",            description: "L'acier et le sang du crépuscule des dieux. Concrètement : débloque la couleur d'appli « Ragnarök » dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["ragnarok"] } },
  "animal:apophis":          { id: "eclipse",       family: "parure",   name: "L'Éclipse",           description: "Le dévoreur de soleil laisse un ciel noir liseré d'or. Concrètement : débloque la couleur d'appli « Éclipse » dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["eclipse"] } },
  "animal:typhon":           { id: "totem",         family: "etendard", name: "Le Père des Monstres", description: "Le père des monstres marche devant les siens. Concrètement : débloque le Totem — une carte de ton choix s'affiche à côté de ton nom chez tes amis (Réglages → Totem).", effect: FEATURE },
  "animal:baku":             { id: "songe",         family: "relique",  name: "Le Songe",            description: "Chaque nuit, Baku dévore les rêves et n'en garde que le plus beau. Concrètement : chaque jour, une carte différente de ta collection s'affiche dans la vitrine de ta home.", effect: FEATURE },
  "animal:hydra-primordial": { id: "venin",         family: "parure",   name: "Le Venin", description: "Le sang de l'Hydre brûle tout ce qu'il touche. Concrètement : débloque la couleur d'appli « Venin » (vert acide) dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["venin"] } },
  "animal:leviathan":        { id: "abysse",        family: "parure",   name: "L'Abysse", description: "La couleur qu'on ne voit qu'à mille mètres sous la surface. Concrètement : débloque la couleur d'appli « Abysse » dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["abysse"] } },
  "animal:nidhogg":          { id: "ecorce",        family: "parure",   name: "L'Écorce", description: "La teinte des racines qui portent le monde. Concrètement : débloque la couleur d'appli « Écorce » (brun-bronze) dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["ecorce"] } },
  "animal:orochi":           { id: "huit-vallees",  family: "parure",   name: "Les Huit Vallées",    description: "Huit têtes, huit humeurs, jamais la même robe. Concrètement : débloque la couleur « Huit Vallées » — la teinte de l'appli change automatiquement chaque jour de la semaine.", effect: { kind: "accent", accents: ["huit-vallees"] } },
  "animal:tiamat":           { id: "mere-dragons",  family: "trone",    name: "La Mère des Dragons", description: "La mère des dragons veille sur ton trésor. Concrètement : débloque un fond d'écran pour la page Collection, à activer dans Réglages → Trônes.", effect: FEATURE },
  "animal:ziz":              { id: "vol-de-ziz",    family: "relique",  name: "Le Vol de Ziz",       description: "Quand l'oiseau-monde passe, le ciel perd ses plumes. Concrètement : pendant l'ouverture des packs, des plumes dorées tombent du ciel.", effect: FEATURE },
  "animal:bahamut":          { id: "azur-divin",    family: "parure",   name: "L'Azur Divin",        description: "L'or des plans célestes sur l'azur du jugement. Concrètement : débloque la couleur d'appli « Azur Divin » dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["azur-divin"] } },
  "animal:ancient-dragon":   { id: "regne",         family: "etendard", name: "Le Règne",            description: "Le premier des dragons adoube qui il veut. Concrètement : débloque six titres à porter sous ton nom, sur ta home et chez tes amis (Réglages → Titre).", effect: FEATURE },
  "animal:qilin":            { id: "jade",          family: "parure",   name: "Le Jade", description: "La pierre des bêtes de bon augure. Concrètement : débloque la couleur d'appli « Jade » dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["jade"] } },

  // ── Auras des 15 fabuleux ──
  "pokemon:arceus":          { id: "alpha",         family: "parure",   name: "L'Alpha",             description: "Le créateur ne choisit pas parmi les couleurs : il les a toutes faites. Concrètement : débloque la roue chromatique libre — n'importe quelle teinte, dans Réglages → Couleur principale.", effect: { kind: "alpha" } },
  "pokemon:mew":             { id: "genome",        family: "oracle",   name: "Le Génome",           description: "Mew porte en lui le code de toutes les créatures. Concrètement : débloque la page Génome (depuis la Collection) — l'index des 2000 cartes, les non-possédées en silhouette.", effect: FEATURE },
  "pokemon:celebi":          { id: "voyage",        family: "oracle",   name: "Le Voyage",           description: "Celebi traverse le temps comme tu traverses la salle. Concrètement : débloque la page « Le Voyage » dans l'Oracle — tes maxis récents comparés à ceux d'il y a six mois, machine par machine.", effect: FEATURE },
  "pokemon:darkrai":         { id: "nuit-sans-lune", family: "parure",  name: "La Nuit Sans Lune",   description: "La nuit du cauchemar, sans une étoile pour te sauver. Concrètement : débloque la couleur « Nuit Sans Lune » (noir pur, pensé pour l'OLED) dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["nuit-sans-lune"] } },
  "pokemon:jirachi":         { id: "voeu",          family: "relique",  name: "Le Vœu",              description: "Jirachi exauce le plus intime des vœux : nommer les choses. Concrètement : permet de donner un surnom à n'importe quelle carte de ta collection, depuis sa fiche.", effect: FEATURE },
  "pokemon:hoopa":           { id: "anneaux",       family: "relique",  name: "Les Anneaux",         description: "Tout ce qui passe par ses anneaux arrive de l'autre monde. Concrètement : les cartes se révèlent en sortant d'anneaux dorés à chaque ouverture de pack.", effect: FEATURE },
  "pokemon:deoxys-normal":   { id: "aurore-australe", family: "parure", name: "L'Aurore Australe",   description: "Un ciel qui n'est jamais deux fois de la même couleur. Concrètement : débloque la couleur « Aurore Australe » — la teinte de l'appli glisse avec l'heure du jour.", effect: { kind: "accent", accents: ["aurore-australe"] } },
  "pokemon:meloetta-aria":   { id: "melodie",       family: "relique",  name: "La Mélodie",          description: "La dernière note mérite un rappel. Concrètement : à chaque clôture de séance récompensée, une pluie de confettis et une vibration rythmée.", effect: FEATURE },
  "pokemon:victini":         { id: "flamme-v",      family: "relique",  name: "La Flamme V",         description: "La victoire appelle la victoire, et Victini compte les siennes. Concrètement : affiche dans la vitrine de ta home ton nombre de séances consécutives avec au moins un record battu.", effect: FEATURE },
  "pokemon:shaymin-land":    { id: "jardin",        family: "trone",    name: "Le Jardin",           description: "Là où Shaymin passe, les fleurs poussent. Concrètement : débloque un fond d'écran fleuri pour la page Séance, à activer dans Réglages → Trônes.", effect: FEATURE },
  "pokemon:manaphy":         { id: "lien",          family: "etendard", name: "Le Lien",             description: "Le cœur de l'océan relie tous les rivages. Concrètement : sur la page de tes amis, débloque la vue de leur plateau — leurs machines gardées et par quelles cartes.", effect: FEATURE },
  "pokemon:diancie":         { id: "sertissage",    family: "etendard", name: "Le Sertissage",       description: "Chaque pierre mérite sa monture. Concrètement : ajoute un cadre serti rose autour de toutes tes cartes dans la Collection.", effect: FEATURE },
  "pokemon:genesect":        { id: "plasma",        family: "parure",   name: "Le Plasma", description: "La charge du canon paléozoïque. Concrètement : débloque la couleur d'appli « Plasma » (violet électrique) dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["plasma"] } },
  "pokemon:keldeo-ordinary": { id: "resolution",    family: "etendard", name: "La Résolution",       description: "La lame ne se forge que par la constance. Concrètement : débloque l'objectif hebdo — fixe ton nombre de séances par semaine (Réglages) et suis-le dans la vitrine.", effect: FEATURE },
  "pokemon:volcanion":       { id: "vapeur",        family: "parure",   name: "La Vapeur",           description: "Le souffle brûlant de la montagne. Concrètement : débloque la couleur d'appli « Vapeur » (cuivre) dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["vapeur"] } },

  // ── Les savoirs dispersés : un oracle = une carte, épique ou au-delà ──
  "pokemon:alakazam":        { id: "boucle",        family: "oracle",   name: "La Boucle",           description: "Un cerveau à deux cuillères n'oublie rien, jamais. Concrètement : débloque la page « La Boucle » dans l'Oracle — tous tes records, datés, du premier au dernier.", effect: FEATURE },
  "animal:megalodon":        { id: "sept-tetes",    family: "oracle",   name: "L'Anatomie du Colosse", description: "Le plus grand prédateur connaît l'anatomie mieux que personne. Concrètement : débloque la page « Anatomie » dans l'Oracle — ton tonnage par groupe musculaire, en barres comparées.", effect: FEATURE },
  "animal:giant-isopod":     { id: "profondeurs",   family: "oracle",   name: "Les Profondeurs",     description: "Le charognard des abysses voit tout ce qui coule et qu'on abandonne. Concrètement : débloque la page « Les Profondeurs » dans l'Oracle — les machines que tu n'as pas faites depuis longtemps.", effect: FEATURE },
  "animal:minotaur":         { id: "racines",       family: "oracle",   name: "Le Labyrinthe",       description: "Au centre du dédale, le gardien se souvient de chaque couloir. Concrètement : débloque l'archive dans l'Oracle — le compte complet de tes séances et l'export de toutes tes données en un fichier.", effect: FEATURE },
  "pokemon:lugia":           { id: "presage",       family: "oracle",   name: "La Carte du Ciel",    description: "Le gardien des cieux lit les jours comme des étoiles. Concrètement : débloque la « Carte du Ciel » dans l'Oracle — tes 365 derniers jours, un carré allumé par jour d'entraînement.", effect: FEATURE },
  "pokemon:registeel":       { id: "scanner",       family: "oracle",   name: "Le Scanner",          description: "Le golem d'acier mesure tout ce qui bouge. Concrètement : débloque le bloc Scanner sur chaque fiche d'exercice — max estimé, record, et ta progression en kg par mois.", effect: FEATURE },

  // ── Les 20 cartes à secret ──
  "animal:domestic-cat":       { id: "squatteur",    family: "relique", name: "Le Squatteur",        description: "Il ne t'a pas choisi, il a choisi ton canapé. Concrètement : un chat s'installe en bas de ta page d'accueil — il dort, il s'étire, il t'ignore.", effect: FEATURE },
  "pokemon:magikarp":          { id: "carpe",        family: "relique", name: "La Légende de la Carpe", description: "Toute légende commence par un poisson qui saute. Concrètement : pose Magicarpe en gardien et éveille-le 60 fois — son filigrane devient un Léviator rouge, pour toujours.", effect: FEATURE },
  "pokemon:eevee":             { id: "evolution",    family: "parure",  name: "L'Évolution",         description: "Trois pierres, trois destins possibles. Concrètement : débloque trois couleurs d'appli — Aquali (bleu), Voltali (jaune), Pyroli (rouge) — dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["aquali", "voltali", "pyroli"] } },
  "pokemon:psyduck":           { id: "migraine",     family: "relique", name: "La Migraine",         description: "Tes progrès lui donnent mal au crâne. Concrètement : à chaque record battu en clôture, Psykokwak surgit en bas de l'écran en se tenant la tête.", effect: FEATURE },
  "animal:axolotl":            { id: "sourire",      family: "relique", name: "Le Sourire",          description: "Il sourit même quand rien ne charge. Concrètement : remplace l'icône de chargement de l'appli, partout, par l'axolotl qui rebondit.", effect: FEATURE },
  "animal:european-goldfinch": { id: "plumage",      family: "parure",  name: "Le Plumage",          description: "Le plus élégant des communs se moque des rares. Concrètement : débloque la couleur d'appli « Plumage » (jaune et rouge) dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["plumage"] } },
  "pokemon:onix":              { id: "colonne",      family: "relique", name: "La Colonne",          description: "Un serpent de pierre ne connaît pas la hâte. Concrètement : ton chrono de repos devient une chaîne de roches qui s'effritent avec le temps.", effect: FEATURE },
  "pokemon:pikachu":           { id: "etincelle",    family: "parure",  name: "L'Étincelle",         description: "La première étincelle de toutes les tempêtes. Concrètement : débloque la couleur d'appli « Foudre » (jaune électrique) dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["foudre"] } },
  "pokemon:ditto":             { id: "copie",        family: "relique", name: "La Copie",            description: "Il n'a pas de forme, il les a toutes. Concrètement : pose Métamorph en gardien — son filigrane imite chaque jour une carte différente de ta collection.", effect: FEATURE },
  "pokemon:jigglypuff":        { id: "berceuse",     family: "relique", name: "La Berceuse",         description: "Sa chanson endort les géants ; toi, elle te repose entre deux séries. Concrètement : Rondoudou chante à côté de ton chrono de repos, micro en main.", effect: FEATURE },
  "animal:platypus":           { id: "inclassable",  family: "relique", name: "L'Inclassable",       description: "Un bec de canard, une queue de castor, du venin : la nature a improvisé. Concrètement : débloque des tris de collection par taille, poids et habitat, dans la Collection.", effect: FEATURE },
  "animal:blue-whale":         { id: "tonnage",      family: "relique", name: "Le Tonnage",          description: "On ne mesure pas un titan en kilogrammes. Concrètement : affiche dans la vitrine de ta home tout le poids soulevé de ta vie, converti en baleines bleues.", effect: FEATURE },
  "pokemon:charizard":         { id: "flamme-draco", family: "parure",  name: "La Flamme Draco",     description: "La flamme qui ne s'éteint qu'avec son porteur. Concrètement : débloque la couleur d'appli « Flamme Draco » (orange braise) dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["flamme-draco"] } },
  "pokemon:snorlax":           { id: "sieste",       family: "relique", name: "La Sieste",           description: "Rien ne réveille Ronflex, sauf toi. Concrètement : après 4 jours sans séance, il s'endort sur ta page d'accueil — et n'en partira qu'à ta prochaine séance.", effect: FEATURE },
  "pokemon:lapras":            { id: "traversee",    family: "trone",   name: "La Traversée",        description: "Lokhlass porte les voyageurs d'une rive à l'autre. Concrètement : débloque un fond d'écran aquatique pour ta page d'accueil, à activer dans Réglages → Trônes.", effect: FEATURE },
  "pokemon:suicune":           { id: "aurore-boreale", family: "parure", name: "L'Aurore Boréale",   description: "Le vent du nord fait ses adieux en couleur. Concrètement : débloque la couleur d'appli « Aurore Boréale » (cyan glacé) dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["aurore-boreale"] } },
  "pokemon:ho-oh":             { id: "flamme-sacree", family: "parure", name: "La Flamme Sacrée",    description: "Là où Ho-Oh se pose, un arc-en-ciel demeure. Concrètement : débloque la couleur d'appli « Flamme Sacrée » (or irisé) dans Réglages → Couleur principale.", effect: { kind: "accent", accents: ["flamme-sacree"] } },
  "animal:basilisk":           { id: "regard",       family: "oracle",  name: "Le Regard",           description: "Ce que le Basilic regarde reste pétrifié à jamais. Concrètement : débloque le Hall des records dans l'Oracle — chaque machine avec son meilleur jour, gravé et daté.", effect: FEATURE },
  "animal:kraken":             { id: "etreinte",     family: "trone",   name: "L'Étreinte",          description: "Aucun navire ne quitte son étreinte. Concrètement : débloque un fond d'écran pour la page Séance — les tentacules du Kraken — à activer dans Réglages → Trônes.", effect: FEATURE },
  "animal:banshee":            { id: "cri",          family: "relique", name: "Le Cri",              description: "Quand la Banshee crie, quelque chose vient de mourir — ici, c'est ton ancien record. Concrètement : une vibration signature, unique, à chaque record battu en clôture.", effect: FEATURE },
};

export const TALENT_COUNT = Object.keys(TALENTS).length;

export function talentOf(category: "animal" | "pokemon", slug: string): TalentDef | null {
  return TALENTS[`${category}:${slug}`] ?? null;
}

export const FAMILY_LABELS: Record<TalentFamily, string> = {
  parure: "Parure",
  trone: "Trône",
  oracle: "Oracle",
  relique: "Relique",
  etendard: "Étendard",
};
