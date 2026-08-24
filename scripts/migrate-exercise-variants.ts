/**
 * Ajoute les versions d'exercice (la salle, en pratique).
 *
 * Certaines machines — les poulies en particulier — ne sont pas reglees pareil
 * d'une salle a l'autre : 40 kg a Bercy n'est pas 40 kg a Nation. On marque
 * ces exercices (`exercises.has_variants`), on leur attache des versions
 * (`exercise_variants`), et chaque passage en seance retient la sienne
 * (`session_exercises.variant_id`). Records, paliers et derniere perf sont
 * alors calcules version par version.
 *
 * Migration purement additive : le code deja deploye ignore ces colonnes et
 * continue de fonctionner.
 *
 *   npx tsx --env-file=.env.local scripts/migrate-exercise-variants.ts          # dry-run
 *   npx tsx --env-file=.env.local scripts/migrate-exercise-variants.ts --apply  # execute
 */
import { neon } from "@neondatabase/serverless";

const APPLY = process.argv.includes("--apply");

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const done = await sql`
    select 1 from information_schema.columns
    where table_name = 'session_exercises' and column_name = 'variant_id'`;
  if (done.length > 0) {
    console.log("Deja migre (session_exercises.variant_id existe). Rien a faire.");
    return;
  }

  console.log("A creer : table exercise_variants");
  console.log("A ajouter : exercises.has_variants, session_exercises.variant_id, exercise_weights.variant_id");
  console.log("A remplacer : unique(exercise_id, weight_kg) -> deux index uniques tenant compte de la version");
  console.log("\nAucune donnee existante n'est modifiee : toutes les nouvelles colonnes sont");
  console.log("nullables ou ont une valeur par defaut.");

  if (!APPLY) {
    console.log("\nDRY-RUN. Relancer avec --apply pour executer.");
    return;
  }

  console.log("\n--- APPLY ---");

  await sql`
    create table if not exists exercise_variants (
      id serial primary key,
      exercise_id integer not null references exercises(id) on delete cascade,
      name text not null,
      created_at timestamptz default now(),
      constraint exercise_variants_exercise_id_name_unique unique (exercise_id, name)
    )`;
  console.log("table exercise_variants creee");

  await sql`alter table exercises add column if not exists has_variants boolean not null default false`;
  await sql`alter table session_exercises add column if not exists variant_id integer
            references exercise_variants(id) on delete set null`;
  await sql`alter table exercise_weights add column if not exists variant_id integer
            references exercise_variants(id) on delete cascade`;
  console.log("colonnes ajoutees");

  await sql`alter table exercise_weights drop constraint if exists exercise_weights_exercise_id_weight_kg_unique`;
  await sql`create unique index if not exists exercise_weights_exercise_variant_weight_idx
            on exercise_weights (exercise_id, variant_id, weight_kg)`;
  await sql`create unique index if not exists exercise_weights_exercise_weight_no_variant_idx
            on exercise_weights (exercise_id, weight_kg) where variant_id is null`;
  console.log("index d'unicite reconstruits");

  const check = await sql`
    select
      (select count(*)::int from exercise_variants) as variantes,
      (select count(*)::int from session_exercises where variant_id is not null) as seances_versionnees,
      (select count(*)::int from exercise_weights) as paliers,
      (select count(*)::int from exercises where has_variants) as exercices_versionnes`;
  console.log("\netat apres migration:", check[0]);
  console.log("Migration terminee.");
}

main();
