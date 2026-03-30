import {
  pgTable,
  serial,
  text,
  integer,
  real,
  date,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const exercises = pgTable(
  "exercises",
  {
    id: serial("id").primaryKey(),
    category: text("category").notNull(),
    muscleGroup: text("muscle_group"),
    name: text("name").notNull(),
    nameFr: text("name_fr").notNull(),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => [unique("exercises_unique").on(table.category, table.muscleGroup, table.name)]
);

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull().defaultNow(),
  notes: text("notes"),
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
});

export const sets = pgTable("sets", {
  id: serial("id").primaryKey(),
  sessionExerciseId: integer("session_exercise_id")
    .notNull()
    .references(() => sessionExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  weightKg: real("weight_kg").notNull(),
  reps: integer("reps").notNull(),
});
