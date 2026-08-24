/**
 * Passe les exercices en catalogue par utilisateur.
 *
 * Avant : une table `exercises` globale, `name` unique globalement — renommer
 * un exercice le renommait pour tout le monde.
 * Apres : chaque exercice appartient a un utilisateur (`exercises.user_id`),
 * unique par (user_id, name). Une table `exercise_catalog` conserve le
 * catalogue de reference, utilise pour pre-remplir un nouvel inscrit.
 *
 * Les paliers de poids (`exercise_weights`) suivent automatiquement, puisque
 * `exercise_id` designe desormais un exercice possede : ils sont reconstruits
 * a partir de l'historique reel de chaque utilisateur.
 *
 *   npx tsx --env-file=.env.local scripts/migrate-exercises-per-user.ts          # dry-run
 *   npx tsx --env-file=.env.local scripts/migrate-exercises-per-user.ts --apply  # execute
 */
import { neon } from "@neondatabase/serverless";

const APPLY = process.argv.includes("--apply");

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const alreadyMigrated = await sql`
    select 1 from information_schema.columns
    where table_name = 'exercises' and column_name = 'user_id'`;
  if (alreadyMigrated.length > 0) {
    console.log("Deja migre (exercises.user_id existe). Rien a faire.");
    return;
  }

  const catalogue = await sql`select * from exercises order by id`;
  const users = await sql`select id, email from users order by id`;
  const links = await sql`
    select s.user_id, se.exercise_id, count(*)::int as uses
    from session_exercises se
    join sessions s on s.id = se.session_id
    group by s.user_id, se.exercise_id`;

  console.log(`${catalogue.length} exercices, ${users.length} utilisateurs`);
  console.log(`-> ${catalogue.length * users.length} exercices possedes apres migration`);
  console.log(`-> ${links.reduce((n, l) => n + Number(l.uses), 0)} session_exercises a repointer`);
  console.log();
  for (const u of users) {
    const mine = links.filter((l) => Number(l.user_id) === Number(u.id));
    const uses = mine.reduce((n, l) => n + Number(l.uses), 0);
    console.log(`  ${u.email}: ${mine.length} exercices utilises, ${uses} occurrences`);
  }

  if (!APPLY) {
    console.log("\nDRY-RUN. Relancer avec --apply pour executer.");
    return;
  }

  console.log("\n--- APPLY ---");

  // 1. Catalogue de reference, fige a partir des exercices actuels.
  await sql`
    create table if not exists exercise_catalog (
      id serial primary key,
      name text not null unique,
      kind text not null default 'muscu',
      is_assisted boolean not null default false,
      muscle_group text,
      muscle_groups text[]
    )`;
  await sql`
    insert into exercise_catalog (name, kind, is_assisted, muscle_group, muscle_groups)
    select name, kind, is_assisted, muscle_group, muscle_groups from exercises
    on conflict (name) do nothing`;
  console.log("catalogue de reference cree");

  // 2. Ouvrir la table : un proprietaire, plus d'unicite globale du nom.
  await sql`alter table exercises add column user_id integer`;
  await sql`alter table exercises drop constraint if exists exercises_name_unique`;

  // 3. Une copie complete du catalogue pour chaque utilisateur.
  const idMap = new Map<string, number>(); // `${userId}:${oldExerciseId}` -> newId
  for (const u of users) {
    for (const e of catalogue) {
      const [row] = await sql`
        insert into exercises (user_id, name, kind, is_assisted, muscle_group, muscle_groups, created_at)
        values (${u.id}, ${e.name}, ${e.kind}, ${e.is_assisted}, ${e.muscle_group}, ${e.muscle_groups}, ${e.created_at})
        returning id`;
      idMap.set(`${u.id}:${e.id}`, row.id);
    }
  }
  console.log(`${idMap.size} exercices possedes crees`);

  // 4. Repointer l'historique vers la copie du bon proprietaire.
  let repointed = 0;
  for (const l of links) {
    const newId = idMap.get(`${l.user_id}:${l.exercise_id}`);
    if (!newId) throw new Error(`pas de copie pour user ${l.user_id} / exercice ${l.exercise_id}`);
    const res = await sql`
      update session_exercises se
      set exercise_id = ${newId}
      from sessions s
      where s.id = se.session_id
        and s.user_id = ${l.user_id}
        and se.exercise_id = ${l.exercise_id}`;
    repointed += Number(res.length ?? 0) || Number(l.uses);
  }
  console.log(`${repointed} session_exercises repointes`);

  const orphans = await sql`
    select count(*)::int as n from session_exercises se
    join exercises e on e.id = se.exercise_id
    where e.user_id is null`;
  if (orphans[0].n > 0) throw new Error(`${orphans[0].n} session_exercises pointent encore sur un exercice global`);

  // 5. Supprimer les lignes globales (conservees dans exercise_catalog).
  await sql`delete from exercises where user_id is null`;

  // 6. Verrouiller les invariants.
  await sql`alter table exercises alter column user_id set not null`;
  await sql`alter table exercises add constraint exercises_user_id_users_id_fk
            foreign key (user_id) references users(id) on delete cascade`;
  await sql`alter table exercises add constraint exercises_user_id_name_unique unique (user_id, name)`;
  console.log("contraintes posees");

  // 7. Reconstruire les paliers depuis l'historique reel de chaque utilisateur.
  await sql`delete from exercise_weights`;
  const inserted = await sql`
    insert into exercise_weights (exercise_id, weight_kg)
    select distinct se.exercise_id, st.weight_kg
    from sets st
    join session_exercises se on se.id = st.session_exercise_id
    join exercises e on e.id = se.exercise_id
    where st.weight_kg is not null and st.weight_kg > 0
      and st.assistance_kg is null and e.kind = 'muscu'
    on conflict (exercise_id, weight_kg) do nothing
    returning id`;
  console.log(`${inserted.length} paliers reconstruits`);

  console.log("\nMigration terminee.");
}

main();
