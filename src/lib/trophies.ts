// ─── Le Cabinet des Trophées ────────────────────────────────────────────────
// La progression par le mérite : chaque trophée se gagne à l'entraînement,
// et les plus importants déverrouillent des morceaux de l'appli. Contrairement
// aux Talents (le hasard des cartes), ici tout est public : on voit la cible,
// on voit sa progression, on sait pourquoi on pousse.

export type TrophyStat =
  | "sessions"        // séances clôturées
  | "records"         // records battus, toutes machines confondues
  | "exercises"       // exercices différents pratiqués
  | "tonnage"         // kilos soulevés en tout
  | "sets"            // séries enregistrées en tout
  | "maxWeight"       // la plus lourde série jamais posée
  | "cardioMinutes"   // minutes de cardio cumulées
  | "streakWeeks"     // semaines consécutives d'entraînement
  | "bestWeek"        // séances dans une même semaine
  | "cardsOwned"      // cartes de la collection
  | "guardiansPosted"; // machines gardées

export type TrophyReward =
  | { type: "picker" }                    // débloque le sélecteur de couleurs
  | { type: "light" }                     // le mode clair, interdit jusque-là
  | { type: "banner" }                    // l'Étendard : une carte en bannière sur la home
  | { type: "smooth" }                    // courbes d'évolution lissées
  | { type: "weekly" }                    // le bilan hebdo sur la home
  | { type: "title"; title: string }      // un titre portable, sous ton nom
  | { type: "badge" };                    // l'honneur, rien que l'honneur

export interface TrophyDef {
  id: string;
  name: string;
  description: string;
  stat: TrophyStat;
  target: number;
  reward: TrophyReward;
  // Ce que le trophée débloque, dit au joueur.
  rewardLabel: string;
  // Une teinte du sélecteur gagnée EN PLUS de la récompense : les couleurs
  // se débloquent une par une, chacune gardée par son trophée.
  color?: string;
}

export const TROPHIES: TrophyDef[] = [

  // ── Les séances ──
  { id: "seances-10", name: "La Prise en Main", description: "10 séances clôturées.", stat: "sessions", target: 10,
    reward: { type: "picker" }, rewardLabel: "Débloque le sélecteur de couleurs — et le rouge", color: "red" },
  { id: "seances-25", name: "Le Rythme", description: "25 séances clôturées.", stat: "sessions", target: 25,
    reward: { type: "badge" }, rewardLabel: "Débloque le rose", color: "pink" },
  { id: "seances-50", name: "Le Métronome", description: "50 séances clôturées.", stat: "sessions", target: 50,
    reward: { type: "smooth" }, rewardLabel: "Débloque les courbes lissées sur les pages d'évolution" },
  { id: "seances-75", name: "Le Régulier", description: "75 séances clôturées.", stat: "sessions", target: 75,
    reward: { type: "title", title: "Le Régulier" }, rewardLabel: "Débloque le titre « Le Régulier »" },
  { id: "seances-90", name: "Les Quatre-Vingt-Dix Passages", description: "90 séances clôturées.", stat: "sessions", target: 90,
    reward: { type: "title", title: "Le Meuble" }, rewardLabel: "Débloque le titre « Le Meuble »" },
  { id: "seances-100", name: "La Fonte Coule", description: "100 séances clôturées.", stat: "sessions", target: 100,
    reward: { type: "light" }, rewardLabel: "Débloque le mode clair — la lumière, enfin" },
  { id: "seances-125", name: "Le Bail Reconduit", description: "125 séances clôturées.", stat: "sessions", target: 125,
    reward: { type: "title", title: "L'Ancien" }, rewardLabel: "Débloque le titre « L'Ancien »" },
  { id: "seances-150", name: "L'Abonnement Rentabilisé", description: "150 séances clôturées.", stat: "sessions", target: 150,
    reward: { type: "title", title: "L'Abonné Rentable" }, rewardLabel: "Débloque le titre « L'Abonné Rentable »" },
  { id: "seances-175", name: "L'Ancienneté Prouvée", description: "175 séances clôturées.", stat: "sessions", target: 175,
    reward: { type: "title", title: "Vieux de la Vieille" }, rewardLabel: "Débloque le titre « Vieux de la Vieille »" },
  { id: "seances-200", name: "Le Monument", description: "200 séances clôturées.", stat: "sessions", target: 200,
    reward: { type: "title", title: "Le Monument" }, rewardLabel: "Débloque le titre « Le Monument »" },
  { id: "seances-250", name: "Le Pilier", description: "250 séances clôturées.", stat: "sessions", target: 250,
    reward: { type: "title", title: "Pilier de Salle" }, rewardLabel: "Débloque le titre « Pilier de Salle »" },
  { id: "seances-300", name: "Les Trois Cents Soirs", description: "300 séances clôturées.", stat: "sessions", target: 300,
    reward: { type: "title", title: "Mur Porteur" }, rewardLabel: "Débloque le titre « Mur Porteur »" },
  { id: "seances-350", name: "Le Bail à Vie", description: "350 séances clôturées.", stat: "sessions", target: 350,
    reward: { type: "title", title: "Le Concierge" }, rewardLabel: "Débloque le titre « Le Concierge »" },
  { id: "seances-365", name: "L'Année de Fonte", description: "365 séances clôturées.", stat: "sessions", target: 365,
    reward: { type: "title", title: "Pas Humain" }, rewardLabel: "Débloque le titre « Pas Humain »" },
  { id: "seances-400", name: "Le Grand Livre des Murs", description: "400 séances clôturées.", stat: "sessions", target: 400,
    reward: { type: "title", title: "Le Chroniqueur des Décennies" }, rewardLabel: "Débloque le titre « Le Chroniqueur des Décennies »" },
  { id: "seances-450", name: "Les Quatre Cent Cinquante Portes", description: "450 séances clôturées.", stat: "sessions", target: 450,
    reward: { type: "title", title: "Le Gardien des Lieux" }, rewardLabel: "Débloque le titre « Le Gardien des Lieux »" },
  { id: "seances-500", name: "Le Demi-Millier", description: "500 séances clôturées.", stat: "sessions", target: 500,
    reward: { type: "title", title: "La Machine" }, rewardLabel: "Débloque le titre « La Machine »" },
  { id: "seances-550", name: "La Mémoire des Murs", description: "550 séances clôturées.", stat: "sessions", target: 550,
    reward: { type: "title", title: "La Mémoire Vivante" }, rewardLabel: "Débloque le titre « La Mémoire Vivante »" },
  { id: "seances-600", name: "Le Sixième Centenaire", description: "600 séances clôturées.", stat: "sessions", target: 600,
    reward: { type: "title", title: "Le Doyen" }, rewardLabel: "Débloque le titre « Le Doyen »" },
  { id: "seances-650", name: "La Fresque Séculaire", description: "650 séances clôturées.", stat: "sessions", target: 650,
    reward: { type: "title", title: "Le Peintre des Murs" }, rewardLabel: "Débloque le titre « Le Peintre des Murs »" },
  { id: "seances-700", name: "Les Sept Cents Présences", description: "700 séances clôturées.", stat: "sessions", target: 700,
    reward: { type: "title", title: "L'Ancêtre" }, rewardLabel: "Débloque le titre « L'Ancêtre »" },
  { id: "seances-750", name: "Le Vétéran", description: "750 séances clôturées.", stat: "sessions", target: 750,
    reward: { type: "title", title: "Le Vétéran" }, rewardLabel: "Débloque le titre « Le Vétéran »" },
  { id: "seances-800", name: "L'Ère du Fer", description: "800 séances clôturées.", stat: "sessions", target: 800,
    reward: { type: "title", title: "Le Fondateur d'Ère" }, rewardLabel: "Débloque le titre « Le Fondateur d'Ère »" },
  { id: "seances-850", name: "L'Éternité Commencée", description: "850 séances clôturées.", stat: "sessions", target: 850,
    reward: { type: "title", title: "La Fondation" }, rewardLabel: "Débloque le titre « La Fondation »" },
  { id: "seances-900", name: "Les Neuf Cents Hivers", description: "900 séances clôturées.", stat: "sessions", target: 900,
    reward: { type: "title", title: "L'Âme des Murs" }, rewardLabel: "Débloque le titre « L'Âme des Murs »" },
  { id: "seances-950", name: "Le Millénaire en Vue", description: "950 séances clôturées.", stat: "sessions", target: 950,
    reward: { type: "title", title: "Le Pèlerin des Décennies" }, rewardLabel: "Débloque le titre « Le Pèlerin des Décennies »" },
  { id: "seances-1000", name: "La Légende", description: "1000 séances clôturées.", stat: "sessions", target: 1000,
    reward: { type: "title", title: "La Légende de la Salle" }, rewardLabel: "Débloque le titre « La Légende de la Salle »" },
  { id: "seances-1100", name: "La Dynastie", description: "1100 séances clôturées.", stat: "sessions", target: 1100,
    reward: { type: "title", title: "Le Patriarche de la Fonte" }, rewardLabel: "Débloque le titre « Le Patriarche de la Fonte »" },
  { id: "seances-1250", name: "L'Odyssée des Murs", description: "1250 séances clôturées.", stat: "sessions", target: 1250,
    reward: { type: "title", title: "L'Homère du Vestiaire" }, rewardLabel: "Débloque le titre « L'Homère du Vestiaire »" },
  { id: "seances-1500", name: "La Cathédrale Achevée", description: "1500 séances clôturées.", stat: "sessions", target: 1500,
    reward: { type: "title", title: "Le Bâtisseur de Cathédrales" }, rewardLabel: "Débloque le titre « Le Bâtisseur de Cathédrales »" },
  { id: "seances-1750", name: "Le Testament des Murs", description: "1750 séances clôturées.", stat: "sessions", target: 1750,
    reward: { type: "title", title: "Le Scribe Éternel" }, rewardLabel: "Débloque le titre « Le Scribe Éternel »" },
  { id: "seances-2000", name: "L'Âge des Légendes", description: "2000 séances clôturées.", stat: "sessions", target: 2000,
    reward: { type: "title", title: "Celui que les Murs Racontent" }, rewardLabel: "Débloque le titre « Celui que les Murs Racontent »" },

  // ── Les records ──
  { id: "records-10", name: "Le Premier Sang", description: "10 records battus.", stat: "records", target: 10,
    reward: { type: "badge" }, rewardLabel: "Débloque le vert", color: "green" },
  { id: "records-25", name: "Le Porte-Étendard", description: "25 records battus.", stat: "records", target: 25,
    reward: { type: "banner" }, rewardLabel: "Débloque l'Étendard : une carte en bannière sur ta home" },
  { id: "records-50", name: "Le Perceur de Plafonds", description: "50 records battus.", stat: "records", target: 50,
    reward: { type: "title", title: "Le Perceur de Plafonds" }, rewardLabel: "Débloque le titre « Le Perceur de Plafonds »" },
  { id: "records-75", name: "Le Bourreau des Charges", description: "75 records battus.", stat: "records", target: 75,
    reward: { type: "title", title: "Casse-Barre" }, rewardLabel: "Débloque le titre « Casse-Barre »" },
  { id: "records-100", name: "Les Cent Sommets", description: "100 records battus.", stat: "records", target: 100,
    reward: { type: "title", title: "Le Conquistador" }, rewardLabel: "Débloque le titre « Le Conquistador »" },
  { id: "records-150", name: "Le Centurion", description: "150 records battus.", stat: "records", target: 150,
    reward: { type: "title", title: "Le Bourrin" }, rewardLabel: "Débloque le titre « Le Bourrin »" },
  { id: "records-200", name: "Les Deux Cents Cimes", description: "200 records battus.", stat: "records", target: 200,
    reward: { type: "title", title: "Le Chamois" }, rewardLabel: "Débloque le titre « Le Chamois »" },
  { id: "records-250", name: "La Grande Conquête", description: "250 records battus.", stat: "records", target: 250,
    reward: { type: "title", title: "Le Conquérant" }, rewardLabel: "Débloque le titre « Le Conquérant »", color: "gold" },
  { id: "records-300", name: "Le Tyran des Machines", description: "300 records battus.", stat: "records", target: 300,
    reward: { type: "title", title: "Le Tyran des Machines" }, rewardLabel: "Débloque le titre « Le Tyran des Machines »" },
  { id: "records-350", name: "Le Toit de la Salle", description: "350 records battus.", stat: "records", target: 350,
    reward: { type: "title", title: "L'Alpiniste" }, rewardLabel: "Débloque le titre « L'Alpiniste »" },
  { id: "records-450", name: "L'Ogre", description: "450 records battus.", stat: "records", target: 450,
    reward: { type: "title", title: "L'Ogre" }, rewardLabel: "Débloque le titre « L'Ogre »" },
  { id: "records-500", name: "Le Demi-Millier de Cimes", description: "500 records battus.", stat: "records", target: 500,
    reward: { type: "title", title: "Le Roi des Cimes" }, rewardLabel: "Débloque le titre « Le Roi des Cimes »" },
  { id: "records-550", name: "La Cordillère", description: "550 records battus.", stat: "records", target: 550,
    reward: { type: "title", title: "Le Montagnard" }, rewardLabel: "Débloque le titre « Le Montagnard »" },
  { id: "records-600", name: "L'Insatiable", description: "600 records battus.", stat: "records", target: 600,
    reward: { type: "title", title: "Pas Naturel" }, rewardLabel: "Débloque le titre « Pas Naturel »" },
  { id: "records-650", name: "L'Everest de Fonte", description: "650 records battus.", stat: "records", target: 650,
    reward: { type: "title", title: "Le Sans-Oxygène" }, rewardLabel: "Débloque le titre « Le Sans-Oxygène »" },
  { id: "records-700", name: "La Terreur des Poulies", description: "700 records battus.", stat: "records", target: 700,
    reward: { type: "title", title: "L'Effroi des Machines" }, rewardLabel: "Débloque le titre « L'Effroi des Machines »" },
  { id: "records-750", name: "Le Cartographe des Sommets", description: "750 records battus.", stat: "records", target: 750,
    reward: { type: "title", title: "Le Cartographe" }, rewardLabel: "Débloque le titre « Le Cartographe »" },
  { id: "records-800", name: "Le Cauchemar des Plaques", description: "800 records battus.", stat: "records", target: 800,
    reward: { type: "title", title: "Le Cauchemar des Plaques" }, rewardLabel: "Débloque le titre « Le Cauchemar des Plaques »" },
  { id: "records-850", name: "L'Olympe Gravi", description: "850 records battus.", stat: "records", target: 850,
    reward: { type: "title", title: "Le Demi-Dieu des Cimes" }, rewardLabel: "Débloque le titre « Le Demi-Dieu des Cimes »" },
  { id: "records-900", name: "La Conquête Totale", description: "900 records battus.", stat: "records", target: 900,
    reward: { type: "title", title: "Le Maître des Sommets" }, rewardLabel: "Débloque le titre « Le Maître des Sommets »" },
  { id: "records-950", name: "La Foudre des Hauteurs", description: "950 records battus.", stat: "records", target: 950,
    reward: { type: "title", title: "Le Porteur de Foudre" }, rewardLabel: "Débloque le titre « Le Porteur de Foudre »" },
  { id: "records-1000", name: "Le Roi des Records", description: "1000 records battus.", stat: "records", target: 1000,
    reward: { type: "title", title: "Le Roi de la Fonte" }, rewardLabel: "Débloque le titre « Le Roi de la Fonte »" },
  { id: "records-1100", name: "Le Panthéon de Fonte", description: "1100 records battus.", stat: "records", target: 1100,
    reward: { type: "title", title: "L'Élu du Panthéon" }, rewardLabel: "Débloque le titre « L'Élu du Panthéon »" },
  { id: "records-1250", name: "Le Trône des Nuages", description: "1250 records battus.", stat: "records", target: 1250,
    reward: { type: "title", title: "Le Souverain des Nuages" }, rewardLabel: "Débloque le titre « Le Souverain des Nuages »" },
  { id: "records-1400", name: "La Couronne des Cimes", description: "1400 records battus.", stat: "records", target: 1400,
    reward: { type: "title", title: "L'Empereur des Altitudes" }, rewardLabel: "Débloque le titre « L'Empereur des Altitudes »" },
  { id: "records-1600", name: "Le Sommet des Dieux", description: "1600 records battus.", stat: "records", target: 1600,
    reward: { type: "title", title: "Le Dieu des Sommets" }, rewardLabel: "Débloque le titre « Le Dieu des Sommets »" },
  { id: "records-1800", name: "L'Ascension Éternelle", description: "1800 records battus.", stat: "records", target: 1800,
    reward: { type: "title", title: "L'Éternel Ascendant" }, rewardLabel: "Débloque le titre « L'Éternel Ascendant »" },
  { id: "records-2000", name: "Le Zénith Absolu", description: "2000 records battus.", stat: "records", target: 2000,
    reward: { type: "title", title: "Le Zénith Incarné" }, rewardLabel: "Débloque le titre « Le Zénith Incarné »" },
  { id: "records-2500", name: "Le Firmament Conquis", description: "2500 records battus.", stat: "records", target: 2500,
    reward: { type: "title", title: "Le Dévoreur de Cieux" }, rewardLabel: "Débloque le titre « Le Dévoreur de Cieux »" },

  // ── La variété ──
  { id: "exercices-10", name: "Le Curieux", description: "10 exercices différents pratiqués.", stat: "exercises", target: 10,
    reward: { type: "title", title: "Le Touriste" }, rewardLabel: "Débloque le titre « Le Touriste »" },
  { id: "exercices-20", name: "Le Grand Tour", description: "20 exercices différents pratiqués.", stat: "exercises", target: 20,
    reward: { type: "title", title: "Le Baroudeur" }, rewardLabel: "Débloque le titre « Le Baroudeur »" },
  { id: "exercices-25", name: "Le Propriétaire", description: "25 exercices différents pratiqués.", stat: "exercises", target: 25,
    reward: { type: "title", title: "Chef de Salle" }, rewardLabel: "Débloque le titre « Chef de Salle »" },
  { id: "exercices-30", name: "La Carte Complète", description: "30 exercices différents pratiqués.", stat: "exercises", target: 30,
    reward: { type: "title", title: "Le Connaisseur" }, rewardLabel: "Débloque le titre « Le Connaisseur »" },
  { id: "exercices-40", name: "L'Encyclopédie", description: "40 exercices différents pratiqués.", stat: "exercises", target: 40,
    reward: { type: "title", title: "L'Encyclopédie" }, rewardLabel: "Débloque le titre « L'Encyclopédie »" },
  { id: "exercices-50", name: "L'Atlas", description: "50 exercices différents pratiqués.", stat: "exercises", target: 50,
    reward: { type: "title", title: "L'Omniscient" }, rewardLabel: "Débloque le titre « L'Omniscient »" },
  { id: "exercices-60", name: "L'Omnipraticien", description: "60 exercices différents pratiqués.", stat: "exercises", target: 60,
    reward: { type: "title", title: "Le Savant Fou" }, rewardLabel: "Débloque le titre « Le Savant Fou »" },
  { id: "exercices-70", name: "La Bibliothèque d'Alexandrie", description: "70 exercices différents pratiqués.", stat: "exercises", target: 70,
    reward: { type: "title", title: "Le Savoir Absolu" }, rewardLabel: "Débloque le titre « Le Savoir Absolu »" },
  { id: "exercices-80", name: "L'Inventaire du Monde", description: "80 exercices différents pratiqués.", stat: "exercises", target: 80,
    reward: { type: "title", title: "Le Recenseur de l'Univers" }, rewardLabel: "Débloque le titre « Le Recenseur de l'Univers »" },

  // ── Le tonnage ──
  { id: "tonnage-25000", name: "Le Poids Lourd", description: "25 tonnes soulevées en tout, un camion chargé à bloc.", stat: "tonnage", target: 25000,
    reward: { type: "title", title: "Le Routier" }, rewardLabel: "Débloque le titre « Le Routier »" },
  { id: "tonnage-75000", name: "Le Char d'Assaut", description: "75 tonnes soulevées en tout, le poids d'un char de combat.", stat: "tonnage", target: 75000,
    reward: { type: "title", title: "Le Blindé" }, rewardLabel: "Débloque le titre « Le Blindé »" },
  { id: "tonnage-100t", name: "Le Centenaire", description: "100 tonnes soulevées en tout.", stat: "tonnage", target: 100000,
    reward: { type: "title", title: "Le Bulldozer" }, rewardLabel: "Débloque le titre « Le Bulldozer »" },
  { id: "tonnage-150000", name: "La Baleine Bleue", description: "150 tonnes soulevées en tout, une baleine bleue entière.", stat: "tonnage", target: 150000,
    reward: { type: "title", title: "La Baleine" }, rewardLabel: "Débloque le titre « La Baleine »" },
  { id: "tonnage-350000", name: "Le Gros-Porteur", description: "350 tonnes soulevées en tout, un avion long-courrier au décollage.", stat: "tonnage", target: 350000,
    reward: { type: "title", title: "Long-Courrier" }, rewardLabel: "Débloque le titre « Long-Courrier »" },
  { id: "tonnage-500t", name: "Le Déplaceur de Montagnes", description: "500 tonnes soulevées en tout.", stat: "tonnage", target: 500000,
    reward: { type: "title", title: "Le Déplaceur de Montagnes" }, rewardLabel: "Débloque le titre « Le Déplaceur de Montagnes »" },
  { id: "tonnage-600000", name: "Le Convoi Exceptionnel", description: "600 tonnes soulevées en tout, un convoi exceptionnel complet.", stat: "tonnage", target: 600000,
    reward: { type: "title", title: "Hors Gabarit" }, rewardLabel: "Débloque le titre « Hors Gabarit »" },
  { id: "tonnage-750000", name: "Le Train de Fret", description: "750 tonnes soulevées en tout, un train de marchandises entier.", stat: "tonnage", target: 750000,
    reward: { type: "title", title: "La Locomotive" }, rewardLabel: "Débloque le titre « La Locomotive »" },
  { id: "tonnage-1000t", name: "Le Kilotonne", description: "1000 tonnes soulevées en tout.", stat: "tonnage", target: 1000000,
    reward: { type: "title", title: "Le Golgoth" }, rewardLabel: "Débloque le titre « Le Golgoth »", color: "yellow" },
  { id: "tonnage-1250000", name: "Le Cargo", description: "1250 tonnes soulevées en tout, un cargo et sa cargaison.", stat: "tonnage", target: 1250000,
    reward: { type: "title", title: "Le Porte-Conteneurs" }, rewardLabel: "Débloque le titre « Le Porte-Conteneurs »" },
  { id: "tonnage-1500000", name: "Le Pont de Fer", description: "1500 tonnes soulevées en tout, le tablier d'un pont métallique.", stat: "tonnage", target: 1500000,
    reward: { type: "title", title: "Tablier de Pont" }, rewardLabel: "Débloque le titre « Tablier de Pont »" },
  { id: "tonnage-2000000", name: "Le Brise-Glace", description: "2000 tonnes soulevées en tout, un brise-glace tout entier.", stat: "tonnage", target: 2000000,
    reward: { type: "title", title: "Coque d'Acier" }, rewardLabel: "Débloque le titre « Coque d'Acier »" },
  { id: "tonnage-2500t", name: "Le Titan", description: "2500 tonnes soulevées en tout.", stat: "tonnage", target: 2500000,
    reward: { type: "title", title: "Le Titan" }, rewardLabel: "Débloque le titre « Le Titan »" },
  { id: "tonnage-3000000", name: "La Frégate", description: "3000 tonnes soulevées en tout, une frégate de la marine nationale.", stat: "tonnage", target: 3000000,
    reward: { type: "title", title: "L'Amiral" }, rewardLabel: "Débloque le titre « L'Amiral »" },
  { id: "tonnage-4000000", name: "Le Colosse de Fer", description: "4000 tonnes soulevées en tout, plus de la moitié de la Tour Eiffel.", stat: "tonnage", target: 4000000,
    reward: { type: "title", title: "Le Colosse" }, rewardLabel: "Débloque le titre « Le Colosse »" },
  { id: "tonnage-5000t", name: "Le Porteur de Mondes", description: "5000 tonnes soulevées en tout.", stat: "tonnage", target: 5000000,
    reward: { type: "title", title: "Porteur de Mondes" }, rewardLabel: "Débloque le titre « Porteur de Mondes »" },
  { id: "tonnage-7500000", name: "La Dame de Fer", description: "7500 tonnes soulevées en tout, la Tour Eiffel au complet.", stat: "tonnage", target: 7500000,
    reward: { type: "title", title: "La Tour Eiffel" }, rewardLabel: "Débloque le titre « La Tour Eiffel »" },
  { id: "tonnage-10000000", name: "Le Cuirassé de Poche", description: "10 000 tonnes soulevées en tout — le poids de la tour Eiffel, boulons compris.", stat: "tonnage", target: 10000000,
    reward: { type: "title", title: "L'Épouvantail des Océans" }, rewardLabel: "Débloque le titre « L'Épouvantail des Océans »" },
  { id: "tonnage-12500000", name: "Le Croiseur Lourd", description: "12 500 tonnes soulevées en tout — un croiseur de guerre tout entier.", stat: "tonnage", target: 12500000,
    reward: { type: "title", title: "Le Canonnier des Mers" }, rewardLabel: "Débloque le titre « Le Canonnier des Mers »" },
  { id: "tonnage-15000000", name: "Le Pont de Brooklyn", description: "15 000 tonnes soulevées en tout — tout l'acier du pont de Brooklyn.", stat: "tonnage", target: 15000000,
    reward: { type: "title", title: "L'Ingénieur des Géants" }, rewardLabel: "Débloque le titre « L'Ingénieur des Géants »" },
  { id: "tonnage-20000000", name: "Les Deux Tours", description: "20 000 tonnes soulevées en tout — deux tours Eiffel empilées.", stat: "tonnage", target: 20000000,
    reward: { type: "title", title: "Le Bâtisseur de Dames de Fer" }, rewardLabel: "Débloque le titre « Le Bâtisseur de Dames de Fer »" },
  { id: "tonnage-25000000", name: "Le Paquebot", description: "25 000 tonnes soulevées en tout — un paquebot transatlantique à quai.", stat: "tonnage", target: 25000000,
    reward: { type: "title", title: "Le Capitaine au Long Cours" }, rewardLabel: "Débloque le titre « Le Capitaine au Long Cours »" },
  { id: "tonnage-35000000", name: "Le Cuirassé Dunkerque", description: "35 000 tonnes soulevées en tout — un cuirassé de ligne, blindage compris.", stat: "tonnage", target: 35000000,
    reward: { type: "title", title: "Le Maître des Arsenaux" }, rewardLabel: "Débloque le titre « Le Maître des Arsenaux »" },
  { id: "tonnage-42500000", name: "Le Porte-Avions", description: "42 500 tonnes soulevées en tout — le Charles de Gaulle, avions compris.", stat: "tonnage", target: 42500000,
    reward: { type: "title", title: "Le Pacha" }, rewardLabel: "Débloque le titre « Le Pacha »" },

  // ── Les séries ──
  { id: "series-1000", name: "Les Mille Séries", description: "1000 séries enregistrées.", stat: "sets", target: 1000,
    reward: { type: "title", title: "Gros Volume" }, rewardLabel: "Débloque le titre « Gros Volume »" },
  { id: "series-1500", name: "L'Atelier Tourne", description: "1 500 séries enregistrées.", stat: "sets", target: 1500,
    reward: { type: "title", title: "Le Contremaître" }, rewardLabel: "Débloque le titre « Le Contremaître »" },
  { id: "series-2000", name: "La Besogne Bien Faite", description: "2 000 séries enregistrées.", stat: "sets", target: 2000,
    reward: { type: "title", title: "L'Outilleur" }, rewardLabel: "Débloque le titre « L'Outilleur »" },
  { id: "series-2500", name: "Le Stakhanoviste", description: "2500 séries enregistrées.", stat: "sets", target: 2500,
    reward: { type: "title", title: "Le Stakhanoviste" }, rewardLabel: "Débloque le titre « Le Stakhanoviste »", color: "blue" },
  { id: "series-3500", name: "Les Trois-Huit", description: "3 500 séries enregistrées.", stat: "sets", target: 3500,
    reward: { type: "title", title: "L'Équipe de Nuit" }, rewardLabel: "Débloque le titre « L'Équipe de Nuit »" },
  { id: "series-4000", name: "La Production Continue", description: "4 000 séries enregistrées.", stat: "sets", target: 4000,
    reward: { type: "title", title: "Le Chef d'Atelier" }, rewardLabel: "Débloque le titre « Le Chef d'Atelier »" },
  { id: "series-5000", name: "L'Usine", description: "5000 séries enregistrées.", stat: "sets", target: 5000,
    reward: { type: "title", title: "L'Usine" }, rewardLabel: "Débloque le titre « L'Usine »" },
  { id: "series-6500", name: "La Chaîne Infinie", description: "6 500 séries enregistrées.", stat: "sets", target: 6500,
    reward: { type: "title", title: "Le Forgeron de Séries" }, rewardLabel: "Débloque le titre « Le Forgeron de Séries »" },
  { id: "series-8000", name: "L'Usine à Séries", description: "8 000 séries enregistrées.", stat: "sets", target: 8000,
    reward: { type: "title", title: "Le Chef de Chaîne" }, rewardLabel: "Débloque le titre « Le Chef de Chaîne »" },
  { id: "series-10000", name: "Le Marteau-Piqueur", description: "10 000 séries enregistrées.", stat: "sets", target: 10000,
    reward: { type: "title", title: "Le Marteau-Piqueur" }, rewardLabel: "Débloque le titre « Le Marteau-Piqueur »" },
  { id: "series-12500", name: "La Grande Manufacture", description: "12 500 séries enregistrées.", stat: "sets", target: 12500,
    reward: { type: "title", title: "Le Directeur d'Usine" }, rewardLabel: "Débloque le titre « Le Directeur d'Usine »" },
  { id: "series-15000", name: "Le Haut-Fourneau", description: "15 000 séries enregistrées.", stat: "sets", target: 15000,
    reward: { type: "title", title: "La Forge Vivante" }, rewardLabel: "Débloque le titre « La Forge Vivante »" },
  { id: "series-17500", name: "La Cadence Industrielle", description: "17 500 séries enregistrées.", stat: "sets", target: 17500,
    reward: { type: "title", title: "Le Moteur Perpétuel" }, rewardLabel: "Débloque le titre « Le Moteur Perpétuel »" },
  { id: "series-20000", name: "Le Complexe Sidérurgique", description: "20 000 séries enregistrées.", stat: "sets", target: 20000,
    reward: { type: "title", title: "Le Baron de l'Acier" }, rewardLabel: "Débloque le titre « Le Baron de l'Acier »" },
  { id: "series-22500", name: "Le Combinat Continental", description: "22 500 séries enregistrées.", stat: "sets", target: 22500,
    reward: { type: "title", title: "Le Directeur du Combinat" }, rewardLabel: "Débloque le titre « Le Directeur du Combinat »" },
  { id: "series-25000", name: "L'Outil Absolu", description: "25 000 séries enregistrées.", stat: "sets", target: 25000,
    reward: { type: "title", title: "L'Outil Vivant" }, rewardLabel: "Débloque le titre « L'Outil Vivant »" },
  { id: "series-30000", name: "La Mégafabrique", description: "30 000 séries enregistrées.", stat: "sets", target: 30000,
    reward: { type: "title", title: "Le Patron de l'Industrie" }, rewardLabel: "Débloque le titre « Le Patron de l'Industrie »" },
  { id: "series-35000", name: "La Forge des Continents", description: "35 000 séries enregistrées.", stat: "sets", target: 35000,
    reward: { type: "title", title: "Le Fondeur de Continents" }, rewardLabel: "Débloque le titre « Le Fondeur de Continents »" },
  { id: "series-40000", name: "Le Réseau Planétaire", description: "40 000 séries enregistrées.", stat: "sets", target: 40000,
    reward: { type: "title", title: "L'Ingénieur du Globe" }, rewardLabel: "Débloque le titre « L'Ingénieur du Globe »" },
  { id: "series-50000", name: "La Mégamachine", description: "50 000 séries enregistrées.", stat: "sets", target: 50000,
    reward: { type: "title", title: "Le Cœur de la Mégamachine" }, rewardLabel: "Débloque le titre « Le Cœur de la Mégamachine »" },
  { id: "series-75000", name: "L'Industrie-Monde", description: "75 000 séries enregistrées.", stat: "sets", target: 75000,
    reward: { type: "title", title: "Le Moteur du Monde" }, rewardLabel: "Débloque le titre « Le Moteur du Monde »" },
  { id: "series-100000", name: "La Planète-Usine", description: "100 000 séries enregistrées.", stat: "sets", target: 100000,
    reward: { type: "title", title: "L'Industrie Faite Homme" }, rewardLabel: "Débloque le titre « L'Industrie Faite Homme »" },

  // ── La charge max ──
  { id: "charge-80", name: "Le Quintal Approche", description: "Une série à 80 kg ou plus.", stat: "maxWeight", target: 80,
    reward: { type: "title", title: "Le Solide" }, rewardLabel: "Débloque le titre « Le Solide »" },
  { id: "charge-90", name: "Le Bahut de Chêne", description: "Une série à 90 kg ou plus.", stat: "maxWeight", target: 90,
    reward: { type: "title", title: "La Bête de Somme" }, rewardLabel: "Débloque le titre « La Bête de Somme »" },
  { id: "charge-100", name: "Le Club des Cent", description: "Une série à 100 kg ou plus.", stat: "maxWeight", target: 100,
    reward: { type: "title", title: "Le Cent Kilos" }, rewardLabel: "Débloque le titre « Le Cent Kilos »" },
  { id: "charge-110", name: "La Poutre Maîtresse", description: "Une série à 110 kg ou plus.", stat: "maxWeight", target: 110,
    reward: { type: "title", title: "Le Percheron" }, rewardLabel: "Débloque le titre « Le Percheron »" },
  { id: "charge-120", name: "Les Cent-Vingt", description: "Une série à 120 kg ou plus.", stat: "maxWeight", target: 120,
    reward: { type: "title", title: "La Charpente" }, rewardLabel: "Débloque le titre « La Charpente »" },
  { id: "charge-130", name: "Le Lit à Baldaquin", description: "Une série à 130 kg ou plus.", stat: "maxWeight", target: 130,
    reward: { type: "title", title: "L'Auroch" }, rewardLabel: "Débloque le titre « L'Auroch »" },
  { id: "charge-140", name: "L'Armoire à Glace", description: "Une série à 140 kg ou plus.", stat: "maxWeight", target: 140,
    reward: { type: "title", title: "Le Déménageur de Pianos" }, rewardLabel: "Débloque le titre « Le Déménageur de Pianos »", color: "purple" },
  { id: "charge-150", name: "L'Armoire", description: "Une série à 150 kg ou plus.", stat: "maxWeight", target: 150,
    reward: { type: "title", title: "L'Armoire Normande" }, rewardLabel: "Débloque le titre « L'Armoire Normande »" },
  { id: "charge-160", name: "Le Piano à Queue", description: "Une série à 160 kg ou plus.", stat: "maxWeight", target: 160,
    reward: { type: "title", title: "Maître Charpentier" }, rewardLabel: "Débloque le titre « Maître Charpentier »" },
  { id: "charge-170", name: "Le Coffre-Fort", description: "Une série à 170 kg ou plus.", stat: "maxWeight", target: 170,
    reward: { type: "title", title: "Le Bison de Trait" }, rewardLabel: "Débloque le titre « Le Bison de Trait »" },
  { id: "charge-180", name: "Le Buffle", description: "Une série à 180 kg ou plus.", stat: "maxWeight", target: 180,
    reward: { type: "title", title: "Le Buffle" }, rewardLabel: "Débloque le titre « Le Buffle »" },
  { id: "charge-190", name: "Le Golem", description: "Une série à 190 kg ou plus.", stat: "maxWeight", target: 190,
    reward: { type: "title", title: "Le Broyeur d'Enclumes" }, rewardLabel: "Débloque le titre « Le Broyeur d'Enclumes »" },
  { id: "charge-200", name: "Le Bicentenaire", description: "Une série à 200 kg ou plus.", stat: "maxWeight", target: 200,
    reward: { type: "title", title: "Le Frigo Américain" }, rewardLabel: "Débloque le titre « Le Frigo Américain »" },
  { id: "charge-220", name: "La Charpente de Cathédrale", description: "Une série à 220 kg ou plus.", stat: "maxWeight", target: 220,
    reward: { type: "title", title: "La Poutre Porteuse" }, rewardLabel: "Débloque le titre « La Poutre Porteuse »" },
  { id: "charge-240", name: "Le Léviathan", description: "Une série à 240 kg ou plus.", stat: "maxWeight", target: 240,
    reward: { type: "title", title: "Le Séisme Ambulant" }, rewardLabel: "Débloque le titre « Le Séisme Ambulant »" },
  { id: "charge-250", name: "Le Mammouth", description: "Une série à 250 kg ou plus.", stat: "maxWeight", target: 250,
    reward: { type: "title", title: "Le Mammouth" }, rewardLabel: "Débloque le titre « Le Mammouth »" },
  { id: "charge-275", name: "Le Mobilier National", description: "Une série à 275 kg ou plus.", stat: "maxWeight", target: 275,
    reward: { type: "title", title: "L'Éléphant de Bât" }, rewardLabel: "Débloque le titre « L'Éléphant de Bât »" },
  { id: "charge-300", name: "Le Chêne Millénaire", description: "Une série à 300 kg ou plus.", stat: "maxWeight", target: 300,
    reward: { type: "title", title: "La Charpente Éternelle" }, rewardLabel: "Débloque le titre « La Charpente Éternelle »" },

  // ── Le cardio ──
  { id: "cardio-100", name: "L'Échauffé", description: "100 minutes de cardio cumulées.", stat: "cardioMinutes", target: 100,
    reward: { type: "title", title: "L'Échauffé" }, rewardLabel: "Débloque le titre « L'Échauffé »", color: "cyan" },
  { id: "cardio-250", name: "La Roue Tourne", description: "250 minutes de cardio cumulées.", stat: "cardioMinutes", target: 250,
    reward: { type: "title", title: "Le Rongeur" }, rewardLabel: "Débloque le titre « Le Rongeur »" },
  { id: "cardio-500", name: "La Roue du Hamster", description: "500 minutes de cardio cumulées.", stat: "cardioMinutes", target: 500,
    reward: { type: "title", title: "Le Hamster" }, rewardLabel: "Débloque le titre « Le Hamster »" },
  { id: "cardio-750", name: "Le Rodage", description: "750 minutes de cardio cumulées.", stat: "cardioMinutes", target: 750,
    reward: { type: "title", title: "Moteur Rodé" }, rewardLabel: "Débloque le titre « Moteur Rodé »" },
  { id: "cardio-1000", name: "Le Coureur de Fond", description: "1000 minutes de cardio cumulées.", stat: "cardioMinutes", target: 1000,
    reward: { type: "title", title: "Les Poumons" }, rewardLabel: "Débloque le titre « Les Poumons »" },
  { id: "cardio-1500", name: "Le Second Souffle", description: "1 500 minutes de cardio cumulées.", stat: "cardioMinutes", target: 1500,
    reward: { type: "title", title: "Second Souffle" }, rewardLabel: "Débloque le titre « Second Souffle »" },
  { id: "cardio-2000", name: "Le Semi-Fond", description: "2000 minutes de cardio cumulées.", stat: "cardioMinutes", target: 2000,
    reward: { type: "title", title: "Le Marathonien du Tapis" }, rewardLabel: "Débloque le titre « Le Marathonien du Tapis »" },
  { id: "cardio-2500", name: "La Mise en Route", description: "2 500 minutes de cardio cumulées.", stat: "cardioMinutes", target: 2500,
    reward: { type: "title", title: "Injection Directe" }, rewardLabel: "Débloque le titre « Injection Directe »" },
  { id: "cardio-3000", name: "Le Fond de Train", description: "3 000 minutes de cardio cumulées.", stat: "cardioMinutes", target: 3000,
    reward: { type: "title", title: "Bon Train" }, rewardLabel: "Débloque le titre « Bon Train »" },
  { id: "cardio-4000", name: "La Cavale", description: "4 000 minutes de cardio cumulées.", stat: "cardioMinutes", target: 4000,
    reward: { type: "title", title: "L'Échappé" }, rewardLabel: "Débloque le titre « L'Échappé »" },
  { id: "cardio-5000", name: "L'Ultra", description: "5000 minutes de cardio cumulées.", stat: "cardioMinutes", target: 5000,
    reward: { type: "title", title: "Le Diesel" }, rewardLabel: "Débloque le titre « Le Diesel »" },
  { id: "cardio-6000", name: "Les Cent Heures", description: "6 000 minutes de cardio cumulées.", stat: "cardioMinutes", target: 6000,
    reward: { type: "title", title: "Cent Heures au Compteur" }, rewardLabel: "Débloque le titre « Cent Heures au Compteur »" },
  { id: "cardio-7500", name: "La Grande Roue", description: "7 500 minutes de cardio cumulées.", stat: "cardioMinutes", target: 7500,
    reward: { type: "title", title: "Hamster Doré" }, rewardLabel: "Débloque le titre « Hamster Doré »" },
  { id: "cardio-10000", name: "Les Dix Mille", description: "10 000 minutes de cardio cumulées.", stat: "cardioMinutes", target: 10000,
    reward: { type: "title", title: "Souffle Infini" }, rewardLabel: "Débloque le titre « Souffle Infini »" },
  { id: "cardio-12500", name: "La Traversée de l'Atlantique", description: "12 500 minutes de cardio cumulées.", stat: "cardioMinutes", target: 12500,
    reward: { type: "title", title: "Le Loup de Mer" }, rewardLabel: "Débloque le titre « Le Loup de Mer »" },
  { id: "cardio-15000", name: "La Locomotive", description: "15 000 minutes de cardio cumulées.", stat: "cardioMinutes", target: 15000,
    reward: { type: "title", title: "Poumons d'Acier" }, rewardLabel: "Débloque le titre « Poumons d'Acier »" },
  { id: "cardio-17500", name: "Le Passage du Cap Horn", description: "17 500 minutes de cardio cumulées.", stat: "cardioMinutes", target: 17500,
    reward: { type: "title", title: "Le Dompteur des Quarantièmes" }, rewardLabel: "Débloque le titre « Le Dompteur des Quarantièmes »" },
  { id: "cardio-20000", name: "Le Moteur Éternel", description: "20 000 minutes de cardio cumulées.", stat: "cardioMinutes", target: 20000,
    reward: { type: "title", title: "Le Turbo-Diesel" }, rewardLabel: "Débloque le titre « Le Turbo-Diesel »" },
  { id: "cardio-25000", name: "Le Tour du Monde à la Rame", description: "25 000 minutes de cardio cumulées.", stat: "cardioMinutes", target: 25000,
    reward: { type: "title", title: "Le Circumnavigateur" }, rewardLabel: "Débloque le titre « Le Circumnavigateur »" },
  { id: "cardio-35000", name: "L'Océan Sans Rivage", description: "35 000 minutes de cardio cumulées.", stat: "cardioMinutes", target: 35000,
    reward: { type: "title", title: "Le Maître des Marées" }, rewardLabel: "Débloque le titre « Le Maître des Marées »" },
  { id: "cardio-50000", name: "Le Souffle Éternel", description: "50 000 minutes de cardio cumulées.", stat: "cardioMinutes", target: 50000,
    reward: { type: "title", title: "L'Océan Incarné" }, rewardLabel: "Débloque le titre « L'Océan Incarné »" },

  // ── La régularité ──
  { id: "streak-4", name: "Le Mois Parfait", description: "4 semaines consécutives.", stat: "streakWeeks", target: 4,
    reward: { type: "weekly" }, rewardLabel: "Débloque le bilan hebdo sur ta home" },
  { id: "streak-6", name: "La Petite Aiguille", description: "6 semaines consécutives.", stat: "streakWeeks", target: 6,
    reward: { type: "title", title: "Le Ponctuel" }, rewardLabel: "Débloque le titre « Le Ponctuel »" },
  { id: "streak-8", name: "Les Deux Mois", description: "8 semaines consécutives.", stat: "streakWeeks", target: 8,
    reward: { type: "title", title: "Le Sérieux" }, rewardLabel: "Débloque le titre « Le Sérieux »", color: "lime" },
  { id: "streak-10", name: "Le Vœu de Régularité", description: "10 semaines consécutives.", stat: "streakWeeks", target: 10,
    reward: { type: "title", title: "Le Frère Convers" }, rewardLabel: "Débloque le titre « Le Frère Convers »" },
  { id: "streak-12", name: "La Saison", description: "12 semaines consécutives.", stat: "streakWeeks", target: 12,
    reward: { type: "title", title: "L'Increvable" }, rewardLabel: "Débloque le titre « L'Increvable »" },
  { id: "streak-16", name: "La Règle de Fer", description: "16 semaines consécutives.", stat: "streakWeeks", target: 16,
    reward: { type: "title", title: "Le Moine Soldat" }, rewardLabel: "Débloque le titre « Le Moine Soldat »" },
  { id: "streak-20", name: "Le Balancier", description: "20 semaines consécutives.", stat: "streakWeeks", target: 20,
    reward: { type: "title", title: "L'Horloger" }, rewardLabel: "Débloque le titre « L'Horloger »" },
  { id: "streak-26", name: "Le Semestre de Fer", description: "26 semaines consécutives.", stat: "streakWeeks", target: 26,
    reward: { type: "title", title: "Le Moine de la Fonte" }, rewardLabel: "Débloque le titre « Le Moine de la Fonte »" },
  { id: "streak-39", name: "Le Grand Carillon", description: "39 semaines consécutives.", stat: "streakWeeks", target: 39,
    reward: { type: "title", title: "Le Maître Horloger" }, rewardLabel: "Débloque le titre « Le Maître Horloger »" },
  { id: "streak-45", name: "Le Vœu Perpétuel", description: "45 semaines consécutives.", stat: "streakWeeks", target: 45,
    reward: { type: "title", title: "L'Ermite de la Fonte" }, rewardLabel: "Débloque le titre « L'Ermite de la Fonte »" },
  { id: "streak-52", name: "L'Année Sans Faille", description: "52 semaines consécutives.", stat: "streakWeeks", target: 52,
    reward: { type: "title", title: "Le Robot" }, rewardLabel: "Débloque le titre « Le Robot »" },
  { id: "streak-60", name: "L'Orbite Complète", description: "60 semaines consécutives.", stat: "streakWeeks", target: 60,
    reward: { type: "title", title: "L'Astre Fixe" }, rewardLabel: "Débloque le titre « L'Astre Fixe »" },
  { id: "streak-65", name: "L'Abbaye Imprenable", description: "65 semaines consécutives.", stat: "streakWeeks", target: 65,
    reward: { type: "title", title: "Le Père Abbé" }, rewardLabel: "Débloque le titre « Le Père Abbé »" },
  { id: "streak-78", name: "Le Calendrier Perpétuel", description: "78 semaines consécutives.", stat: "streakWeeks", target: 78,
    reward: { type: "title", title: "L'Horloge Parlante" }, rewardLabel: "Débloque le titre « L'Horloge Parlante »" },
  { id: "streak-90", name: "L'Éternité en Marche", description: "90 semaines consécutives.", stat: "streakWeeks", target: 90,
    reward: { type: "title", title: "Hors du Temps" }, rewardLabel: "Débloque le titre « Hors du Temps »" },
  { id: "streak-104", name: "Les Deux Ans", description: "104 semaines consécutives.", stat: "streakWeeks", target: 104,
    reward: { type: "title", title: "L'Immortel" }, rewardLabel: "Débloque le titre « L'Immortel »" },
  { id: "streak-117", name: "La Voûte Céleste", description: "117 semaines consécutives.", stat: "streakWeeks", target: 117,
    reward: { type: "title", title: "Le Berger des Étoiles" }, rewardLabel: "Débloque le titre « Le Berger des Étoiles »" },
  { id: "streak-130", name: "Les Cent Trente Vêpres", description: "130 semaines consécutives.", stat: "streakWeeks", target: 130,
    reward: { type: "title", title: "Le Chantre Perpétuel" }, rewardLabel: "Débloque le titre « Le Chantre Perpétuel »" },
  { id: "streak-156", name: "La Constellation Achevée", description: "156 semaines consécutives.", stat: "streakWeeks", target: 156,
    reward: { type: "title", title: "L'Astre Immortel" }, rewardLabel: "Débloque le titre « L'Astre Immortel »" },

  // ── La semaine ──
  { id: "semaine-4", name: "Le Quatre sur Sept", description: "4 séances dans la même semaine.", stat: "bestWeek", target: 4,
    reward: { type: "title", title: "L'Assidu" }, rewardLabel: "Débloque le titre « L'Assidu »" },
  { id: "semaine-5", name: "La Semaine Sauvage", description: "5 séances dans la même semaine.", stat: "bestWeek", target: 5,
    reward: { type: "title", title: "Le Sanglier" }, rewardLabel: "Débloque le titre « Le Sanglier »" },
  { id: "semaine-6", name: "L'Acharnement", description: "6 séances dans la même semaine.", stat: "bestWeek", target: 6,
    reward: { type: "title", title: "L'Acharné" }, rewardLabel: "Débloque le titre « L'Acharné »" },
  { id: "semaine-7", name: "L'Impossible Semaine", description: "7 séances dans la même semaine.", stat: "bestWeek", target: 7,
    reward: { type: "title", title: "Le Disjoncté" }, rewardLabel: "Débloque le titre « Le Disjoncté »" },

  // ── La collection ──
  { id: "cartes-50", name: "Le Collectionneur", description: "50 cartes dans le Vault.", stat: "cardsOwned", target: 50,
    reward: { type: "title", title: "Le Dresseur" }, rewardLabel: "Débloque le titre « Le Dresseur »" },
  { id: "cartes-75", name: "Le Petit Négoce", description: "75 cartes dans le Vault.", stat: "cardsOwned", target: 75,
    reward: { type: "title", title: "Le Brocanteur" }, rewardLabel: "Débloque le titre « Le Brocanteur »" },
  { id: "cartes-100", name: "L'Archiviste", description: "100 cartes dans le Vault.", stat: "cardsOwned", target: 100,
    reward: { type: "title", title: "L'Archiviste" }, rewardLabel: "Débloque le titre « L'Archiviste »" },
  { id: "cartes-150", name: "Le Classeur Plein", description: "150 cartes dans le Vault.", stat: "cardsOwned", target: 150,
    reward: { type: "title", title: "Le Trieur de Classeurs" }, rewardLabel: "Débloque le titre « Le Trieur de Classeurs »" },
  { id: "cartes-200", name: "Le Magnat", description: "200 cartes dans le Vault.", stat: "cardsOwned", target: 200,
    reward: { type: "title", title: "Le Magnat" }, rewardLabel: "Débloque le titre « Le Magnat »" },
  { id: "cartes-250", name: "La Réserve", description: "250 cartes dans le Vault.", stat: "cardsOwned", target: 250,
    reward: { type: "title", title: "Le Marchand de Cartes" }, rewardLabel: "Débloque le titre « Le Marchand de Cartes »" },
  { id: "cartes-300", name: "Le Comptoir", description: "300 cartes dans le Vault.", stat: "cardsOwned", target: 300,
    reward: { type: "title", title: "Le Négociant" }, rewardLabel: "Débloque le titre « Le Négociant »" },
  { id: "cartes-350", name: "La Belle Étagère", description: "350 cartes dans le Vault.", stat: "cardsOwned", target: 350,
    reward: { type: "title", title: "Le Fortuné du Vestiaire" }, rewardLabel: "Débloque le titre « Le Fortuné du Vestiaire »" },
  { id: "cartes-400", name: "Le Baron de la Carte", description: "400 cartes dans le Vault.", stat: "cardsOwned", target: 400,
    reward: { type: "title", title: "Le Baron de la Carte" }, rewardLabel: "Débloque le titre « Le Baron de la Carte »" },
  { id: "cartes-500", name: "Le Demi-Vault", description: "500 cartes dans le Vault.", stat: "cardsOwned", target: 500,
    reward: { type: "title", title: "Le Grossiste" }, rewardLabel: "Débloque le titre « Le Grossiste »" },
  { id: "cartes-600", name: "La Caverne", description: "600 cartes dans le Vault.", stat: "cardsOwned", target: 600,
    reward: { type: "title", title: "L'Antiquaire" }, rewardLabel: "Débloque le titre « L'Antiquaire »" },
  { id: "cartes-650", name: "Le Coffre Blindé", description: "650 cartes dans le Vault.", stat: "cardsOwned", target: 650,
    reward: { type: "title", title: "Le Banquier du Vault" }, rewardLabel: "Débloque le titre « Le Banquier du Vault »" },
  { id: "cartes-700", name: "La Fortune de Salle", description: "700 cartes dans le Vault.", stat: "cardsOwned", target: 700,
    reward: { type: "title", title: "Le Rentier de la Fonte" }, rewardLabel: "Débloque le titre « Le Rentier de la Fonte »" },
  { id: "cartes-800", name: "Le Grand Négoce", description: "800 cartes dans le Vault.", stat: "cardsOwned", target: 800,
    reward: { type: "title", title: "L'Armateur" }, rewardLabel: "Débloque le titre « L'Armateur »" },
  { id: "cartes-900", name: "Le Grand Musée", description: "900 cartes dans le Vault.", stat: "cardsOwned", target: 900,
    reward: { type: "title", title: "Le Conservateur en Chef" }, rewardLabel: "Débloque le titre « Le Conservateur en Chef »" },
  { id: "cartes-1000", name: "Le Millier de Cartes", description: "1000 cartes dans le Vault.", stat: "cardsOwned", target: 1000,
    reward: { type: "title", title: "Le Nabab" }, rewardLabel: "Débloque le titre « Le Nabab »" },
  { id: "cartes-1100", name: "L'Empire Naissant", description: "1100 cartes dans le Vault.", stat: "cardsOwned", target: 1100,
    reward: { type: "title", title: "L'Empereur des Classeurs" }, rewardLabel: "Débloque le titre « L'Empereur des Classeurs »" },
  { id: "cartes-1200", name: "La Salle des Coffres", description: "1200 cartes dans le Vault.", stat: "cardsOwned", target: 1200,
    reward: { type: "title", title: "Le Crésus du Rack" }, rewardLabel: "Débloque le titre « Le Crésus du Rack »" },
  { id: "cartes-1300", name: "La Galerie des Glaces", description: "1300 cartes dans le Vault.", stat: "cardsOwned", target: 1300,
    reward: { type: "title", title: "Le Curateur Suprême" }, rewardLabel: "Débloque le titre « Le Curateur Suprême »" },
  { id: "cartes-1500", name: "Le Vault Souverain", description: "1500 cartes dans le Vault.", stat: "cardsOwned", target: 1500,
    reward: { type: "title", title: "Le Maître du Vault" }, rewardLabel: "Débloque le titre « Le Maître du Vault »" },
  { id: "cartes-1750", name: "La Dernière Aile", description: "1750 cartes dans le Vault.", stat: "cardsOwned", target: 1750,
    reward: { type: "title", title: "Le Bâtisseur d'Empire" }, rewardLabel: "Débloque le titre « Le Bâtisseur d'Empire »" },
  { id: "cartes-2000", name: "La Collection Universelle", description: "2000 cartes dans le Vault. Catalogue complet.", stat: "cardsOwned", target: 2000,
    reward: { type: "title", title: "Le Maître de l'Univers" }, rewardLabel: "Débloque le titre « Le Maître de l'Univers »" },
];

export interface TrophyStats {
  sessions: number;
  records: number;
  exercises: number;
  tonnage: number;
  sets: number;
  maxWeight: number;
  cardioMinutes: number;
  streakWeeks: number;
  bestWeek: number;
  cardsOwned: number;
  guardiansPosted: number;
}

export function earnedTrophyIds(stats: TrophyStats): string[] {
  return TROPHIES.filter((t) => stats[t.stat] >= t.target).map((t) => t.id);
}

// ── Les couleurs et leurs gardiens ──────────────────────────────────────────
// « orange » est la couleur d'origine, toujours libre. Tout le reste se
// gagne UNE TEINTE À LA FOIS : le sélecteur (et le rouge) à 10 séances,
// puis chaque couleur gardée par son propre trophée. Le mode clair, lui,
// attend la centième séance.
export const FREE_COLOR = "orange";

export function unlockedTrophyColors(earned: string[]): Set<string> {
  const colors = new Set<string>([FREE_COLOR]);
  for (const t of TROPHIES) {
    if (t.color && earned.includes(t.id)) colors.add(t.color);
  }
  return colors;
}

// La teinte affichée sous chaque pastille verrouillée : quel trophée l'ouvre.
export function colorTrophyHint(color: string): string | null {
  if (color === FREE_COLOR) return null;
  const t = TROPHIES.find((t) => t.color === color);
  if (!t) return null;
  return t.description.replace(" clôturées.", "").replace(".", "");
}

// Les titres portables gagnés au cabinet.
export function trophyTitles(earned: string[]): string[] {
  return TROPHIES.filter(
    (t): t is TrophyDef & { reward: { type: "title"; title: string } } =>
      t.reward.type === "title" && earned.includes(t.id),
  ).map((t) => t.reward.title);
}

export function hasTrophyFeature(
  earned: string[],
  feature: "picker" | "banner" | "smooth" | "weekly" | "light",
): boolean {
  return TROPHIES.some((t) => t.reward.type === feature && earned.includes(t.id));
}
