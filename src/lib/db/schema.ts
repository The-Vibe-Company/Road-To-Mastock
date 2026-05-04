import {
  pgTable,
  serial,
  text,
  integer,
  real,
  date,
  timestamp,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  accentColor: text("accent_color").default("orange"),
  theme: text("theme").default("dark"),
  cardsTokens: integer("cards_tokens").notNull().default(0),
  cardsSpecialTokens: integer("cards_special_tokens").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // 'muscu' | 'cardio'. Drives which set fields (weight/reps vs duration/calories/...) apply.
  kind: text("kind").notNull().default("muscu"),
  muscleGroup: text("muscle_group"),
  muscleGroups: text("muscle_groups").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull().defaultNow(),
  notes: text("notes"),
  terminatedAt: timestamp("terminated_at", { withTimezone: true }),
  tokensGrantedAt: timestamp("tokens_granted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const sessionExercises = pgTable("session_exercises", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  sortOrder: integer("sort_order").default(0),
  locked: boolean("locked").default(false).notNull(),
  notes: text("notes"),
});

export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  addresseeId: integer("addressee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const exerciseWeights = pgTable(
  "exercise_weights",
  {
    id: serial("id").primaryKey(),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    weightKg: real("weight_kg").notNull(),
  },
  (t) => [unique().on(t.exerciseId, t.weightKg)]
);

export const sets = pgTable("sets", {
  id: serial("id").primaryKey(),
  sessionExerciseId: integer("session_exercise_id")
    .notNull()
    .references(() => sessionExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  // Muscu fields — null on cardio sets.
  weightKg: real("weight_kg"),
  reps: integer("reps"),
  // Cardio fields — null on muscu sets. Always present together for cardio.
  durationMinutes: integer("duration_minutes"),
  calories: integer("calories"),
  // Per-machine cardio detail (all nullable, only relevant for some machines).
  distanceKm: real("distance_km"),
  avgSpeedKmh: real("avg_speed_kmh"),
  resistanceLevel: integer("resistance_level"),
});

export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  rarity: text("rarity").notNull(),
  cardNumber: integer("card_number"),
  scientificName: text("scientific_name"),
  imageUrl: text("image_url"),
  description: text("description"),
  flavor: text("flavor"),
  heightCm: real("height_cm"),
  weightKg: real("weight_kg"),
  habitat: text("habitat"),
});

export const userCards = pgTable(
  "user_cards",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animals.id),
    count: integer("count").notNull().default(1),
    firstObtainedAt: timestamp("first_obtained_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique().on(t.userId, t.animalId)],
);

export const userShards = pgTable(
  "user_shards",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rarity: text("rarity").notNull(),
    category: text("category").notNull().default("animal"),
    count: integer("count").notNull().default(0),
  },
  (t) => [unique().on(t.userId, t.rarity, t.category)],
);

export const pokemon = pgTable("pokemon", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  rarity: text("rarity").notNull(),
  pokedexNumber: integer("pokedex_number"),
  primaryType: text("primary_type"),
  secondaryType: text("secondary_type"),
  imageUrl: text("image_url"),
  flavor: text("flavor"),
  heightCm: real("height_cm"),
  weightKg: real("weight_kg"),
  habitat: text("habitat"),
});

export const userPokemonCards = pgTable(
  "user_pokemon_cards",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pokemonId: integer("pokemon_id")
      .notNull()
      .references(() => pokemon.id),
    count: integer("count").notNull().default(1),
    firstObtainedAt: timestamp("first_obtained_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique().on(t.userId, t.pokemonId)],
);
