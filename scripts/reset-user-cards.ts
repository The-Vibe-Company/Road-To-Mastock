/**
 * Resets the cards/sessions state for a given user.
 *
 *  ⚠️  NEVER deletes sessions. Sessions are PRESERVED — only the tokens-related
 *      columns (terminated_at, tokens_granted_at) are cleared.
 *
 * What this script does:
 *  - UN-TERMINATES all their sessions (terminated_at = NULL)
 *  - clears tokens_granted_at so re-terminating grants tokens again
 *  - resets cards_tokens AND cards_special_tokens to 0
 *  - deletes all user_cards, user_pokemon_cards, user_shards
 *
 * Usage: npx tsx scripts/reset-user-cards.ts <email>
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local", override: true });

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/reset-user-cards.ts <email>");
    process.exit(1);
  }

  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  const u = (await db.execute(sql`
    SELECT id, name, email, cards_tokens FROM users WHERE email = ${email}
  `)) as unknown as { rows?: { id: number; name: string; email: string; cards_tokens: number }[] };
  const user = ((u.rows ?? u) as unknown as { id: number; name: string; email: string; cards_tokens: number }[])[0];

  if (!user) {
    console.error(`No user with email ${email}`);
    process.exit(1);
  }

  console.log(`Resetting state for: ${user.name} <${user.email}> (id=${user.id}, tokens=${user.cards_tokens})`);

  const results = await Promise.all([
    db.execute(sql`DELETE FROM user_cards WHERE user_id = ${user.id}`),
    db.execute(sql`DELETE FROM user_pokemon_cards WHERE user_id = ${user.id}`),
    db.execute(sql`DELETE FROM user_shards WHERE user_id = ${user.id}`),
    db.execute(sql`UPDATE sessions SET terminated_at = NULL, tokens_granted_at = NULL WHERE user_id = ${user.id}`),
    db.execute(sql`UPDATE users SET cards_tokens = 0, cards_special_tokens = 0 WHERE id = ${user.id}`),
  ]);

  const [delAnim, delPoke, delShards, updSessions] = results as unknown as { rowCount?: number }[];

  console.log(`  -${delAnim.rowCount ?? "?"} animals from collection`);
  console.log(`  -${delPoke.rowCount ?? "?"} pokemon from collection`);
  console.log(`  -${delShards.rowCount ?? "?"} shard rows`);
  console.log(`  ${updSessions.rowCount ?? "?"} sessions un-terminated (NEVER deleted)`);
  console.log(`  cards_tokens → 0  ·  cards_special_tokens → 0`);
  console.log(`Done.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
