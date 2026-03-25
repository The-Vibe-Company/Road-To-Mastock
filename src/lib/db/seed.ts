import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { exercises } from "./schema";
import { config } from "dotenv";
config({ path: ".env.local" });

const seedData = [
  // Upper Body - Back
  { category: "Upper Body", muscleGroup: "Back", name: "Lat Pulldown", nameFr: "Tirage vertical", sortOrder: 1 },
  { category: "Upper Body", muscleGroup: "Back", name: "Cable Row", nameFr: "Tirage horizontal", sortOrder: 2 },
  { category: "Upper Body", muscleGroup: "Back", name: "Assisted Pull-Up", nameFr: "Tractions assistées", sortOrder: 3 },

  // Upper Body - Chest
  { category: "Upper Body", muscleGroup: "Chest", name: "Chest Press", nameFr: "Presse poitrine", sortOrder: 1 },
  { category: "Upper Body", muscleGroup: "Chest", name: "Pec Deck / Butterfly", nameFr: "Pec Deck / Papillon", sortOrder: 2 },
  { category: "Upper Body", muscleGroup: "Chest", name: "Cable Crossover", nameFr: "Croisé poulie", sortOrder: 3 },

  // Upper Body - Shoulders
  { category: "Upper Body", muscleGroup: "Shoulders", name: "Shoulder Press", nameFr: "Développé épaules", sortOrder: 1 },
  { category: "Upper Body", muscleGroup: "Shoulders", name: "Lateral Raise Machine", nameFr: "Élévation latérale machine", sortOrder: 2 },
  { category: "Upper Body", muscleGroup: "Shoulders", name: "Rear Delt Fly", nameFr: "Oiseau arrière", sortOrder: 3 },

  // Upper Body - Biceps
  { category: "Upper Body", muscleGroup: "Biceps", name: "Bicep Curl Machine", nameFr: "Machine curl biceps", sortOrder: 1 },
  { category: "Upper Body", muscleGroup: "Biceps", name: "Cable Bicep Curl", nameFr: "Curl biceps poulie", sortOrder: 2 },

  // Upper Body - Triceps
  { category: "Upper Body", muscleGroup: "Triceps", name: "Tricep Pushdown Cable", nameFr: "Pushdown triceps poulie", sortOrder: 1 },
  { category: "Upper Body", muscleGroup: "Triceps", name: "Tricep Dip Machine", nameFr: "Machine dips triceps", sortOrder: 2 },
  { category: "Upper Body", muscleGroup: "Triceps", name: "Tricep Extension Machine", nameFr: "Extension triceps machine", sortOrder: 3 },

  // Lower Body - Quads
  { category: "Lower Body", muscleGroup: "Quads", name: "Leg Press", nameFr: "Presse à cuisses", sortOrder: 1 },
  { category: "Lower Body", muscleGroup: "Quads", name: "Hack Squat", nameFr: "Hack Squat", sortOrder: 2 },
  { category: "Lower Body", muscleGroup: "Quads", name: "Leg Extension", nameFr: "Extension des jambes", sortOrder: 3 },
  { category: "Lower Body", muscleGroup: "Quads", name: "Smith Machine", nameFr: "Smith Machine", sortOrder: 4 },

  // Lower Body - Hamstrings
  { category: "Lower Body", muscleGroup: "Hamstrings", name: "Seated Leg Curl", nameFr: "Leg curl assis", sortOrder: 1 },
  { category: "Lower Body", muscleGroup: "Hamstrings", name: "Lying Leg Curl", nameFr: "Leg curl couché", sortOrder: 2 },

  // Lower Body - Glutes
  { category: "Lower Body", muscleGroup: "Glutes", name: "Hip Abduction", nameFr: "Abducteur", sortOrder: 1 },
  { category: "Lower Body", muscleGroup: "Glutes", name: "Hip Adduction", nameFr: "Adducteur", sortOrder: 2 },

  // Lower Body - Calves
  { category: "Lower Body", muscleGroup: "Calves", name: "Seated Calf Raise", nameFr: "Mollets assis", sortOrder: 1 },
  { category: "Lower Body", muscleGroup: "Calves", name: "Standing Calf Raise", nameFr: "Mollets debout", sortOrder: 2 },

  // Core
  { category: "Core", muscleGroup: "Abs", name: "Abdominal Crunch Machine", nameFr: "Machine crunch abdominaux", sortOrder: 1 },
  { category: "Core", muscleGroup: "Abs", name: "Ab / Back Extension", nameFr: "Extension lombaire / abdos", sortOrder: 2 },

  // Cardio
  { category: "Cardio", muscleGroup: null, name: "Treadmill", nameFr: "Tapis de course", sortOrder: 1 },
  { category: "Cardio", muscleGroup: null, name: "Elliptical", nameFr: "Vélo elliptique", sortOrder: 2 },
  { category: "Cardio", muscleGroup: null, name: "Rowing Machine", nameFr: "Rameur", sortOrder: 3 },
  { category: "Cardio", muscleGroup: null, name: "Exercise Bike", nameFr: "Vélo d'appartement", sortOrder: 4 },
  { category: "Cardio", muscleGroup: null, name: "Stair Climber", nameFr: "Stepper / Escalier", sortOrder: 5 },

  // Free Weights
  { category: "Free Weights", muscleGroup: null, name: "Dumbbells", nameFr: "Haltères", sortOrder: 1 },
  { category: "Free Weights", muscleGroup: null, name: "Barbells", nameFr: "Barres", sortOrder: 2 },
  { category: "Free Weights", muscleGroup: null, name: "Kettlebells", nameFr: "Kettlebells", sortOrder: 3 },
];

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("Seeding exercises...");
  await db.insert(exercises).values(seedData).onConflictDoNothing();
  console.log(`Seeded ${seedData.length} exercises.`);
}

seed().catch(console.error);
