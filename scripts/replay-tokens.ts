/**
 * Replays the entire session-termination history for a user, applying the
 * CURRENT special-token logic (1 special per ISO week of session date).
 *
 *  ⚠️  NEVER deletes sessions. Sessions are PRESERVED — only:
 *       - tokens-related columns are reset (terminated_at, tokens_granted_at)
 *       - then sessions are re-terminated in chronological order
 *       - user_cards / user_pokemon_cards / user_shards are wiped
 *       - cards_tokens / cards_special_tokens are reset to 0 then regrown
 *
 * Usage:
 *   npx tsx scripts/replay-tokens.ts <email> [--dry-run] [--write]
 *
 *   --dry-run (default)  : prints the plan, does NOT modify the DB
 *   --write              : actually performs the reset + replay
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

type SessionRow = { id: number; date: string; terminated_at: string | null };

async function main() {
  const email = process.argv[2];
  const flag = process.argv[3] ?? "--dry-run";
  const dryRun = flag !== "--write";

  if (!email) {
    console.error("Usage: npx tsx scripts/replay-tokens.ts <email> [--dry-run|--write]");
    process.exit(1);
  }

  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  // 1. Find user
  const u = (await db.execute(sql`
    SELECT id, name, email, cards_tokens, cards_special_tokens
    FROM users WHERE email = ${email}
  `)) as unknown as {
    rows?: { id: number; name: string; email: string; cards_tokens: number; cards_special_tokens: number }[];
  };
  const user = ((u.rows ?? u) as unknown as {
    id: number; name: string; email: string; cards_tokens: number; cards_special_tokens: number;
  }[])[0];
  if (!user) {
    console.error(`No user with email ${email}`);
    process.exit(1);
  }

  console.log(`\n${"━".repeat(70)}`);
  console.log(`User: ${user.name} <${user.email}> (id=${user.id})`);
  console.log(`Current state: cards_tokens=${user.cards_tokens} · cards_special_tokens=${user.cards_special_tokens}`);
  console.log(`Mode: ${dryRun ? "🔍 DRY RUN (no DB changes)" : "✏️  WRITE (will modify DB)"}`);
  console.log("━".repeat(70));

  // 2. Get all sessions ordered chronologically
  const sRes = (await db.execute(sql`
    SELECT id, date::text AS date, terminated_at::text AS terminated_at
    FROM sessions
    WHERE user_id = ${user.id}
    ORDER BY date ASC, id ASC
  `)) as unknown as { rows?: SessionRow[] };
  const sessions = (sRes.rows ?? sRes) as unknown as SessionRow[];
  console.log(`\n${sessions.length} sessions found.`);

  // 3. Plan: distinct ISO weeks with at least 1 session = number of special tokens
  const weekKey = (dateStr: string) => {
    // Match Postgres DATE_TRUNC('week', ...) which uses ISO weeks (Monday-start).
    const d = new Date(dateStr + "T00:00:00Z");
    const day = d.getUTCDay() || 7; // Sunday → 7
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - (day - 1));
    return monday.toISOString().slice(0, 10);
  };
  const weeks = new Map<string, SessionRow[]>();
  for (const s of sessions) {
    const k = weekKey(s.date);
    if (!weeks.has(k)) weeks.set(k, []);
    weeks.get(k)!.push(s);
  }
  const expectedSpecials = weeks.size;
  const expectedNormals = sessions.length - expectedSpecials;

  console.log(`\nDistinct ISO weeks with sessions: ${weeks.size}`);
  console.log(`Expected outcome:`);
  console.log(`  +${expectedSpecials} special tokens (1 per ISO week)`);
  console.log(`  +${expectedNormals} normal tokens (sessions 2/3/…/N of each week)`);
  console.log(`\nPer-week breakdown (ISO Monday → count):`);
  const sortedWeeks = [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [monday, rows] of sortedWeeks) {
    console.log(`  ${monday}  ${rows.length} session${rows.length > 1 ? "s" : ""}  →  +1 special, +${rows.length - 1} normal`);
  }

  if (dryRun) {
    console.log(`\n🔍 Dry run only. Re-run with --write to apply.\n`);
    return;
  }

  // 4. Reset state
  console.log(`\n→ resetting state...`);
  await db.execute(sql`UPDATE sessions SET terminated_at = NULL, tokens_granted_at = NULL WHERE user_id = ${user.id}`);
  await db.execute(sql`DELETE FROM user_cards WHERE user_id = ${user.id}`);
  await db.execute(sql`DELETE FROM user_pokemon_cards WHERE user_id = ${user.id}`);
  await db.execute(sql`DELETE FROM user_shards WHERE user_id = ${user.id}`);
  await db.execute(sql`UPDATE users SET cards_tokens = 0, cards_special_tokens = 0 WHERE id = ${user.id}`);
  console.log(`  cleared collections, sessions un-terminated, balances → 0`);

  // 5. Replay terminations chronologically
  console.log(`\n→ replaying ${sessions.length} terminations...`);
  let specials = 0;
  let normals = 0;
  for (const session of sessions) {
    // Mark this session terminated + token granted at NOW()
    await db.execute(sql`
      UPDATE sessions
      SET terminated_at = NOW(), tokens_granted_at = NOW()
      WHERE id = ${session.id} AND user_id = ${user.id} AND tokens_granted_at IS NULL
    `);

    // Count OTHER sessions already granted in same ISO week (based on session.date)
    const cRes = (await db.execute(sql`
      SELECT COUNT(*)::int AS "countBefore"
      FROM sessions
      WHERE user_id = ${user.id}
        AND tokens_granted_at IS NOT NULL
        AND id != ${session.id}
        AND DATE_TRUNC('week', date::timestamp) = DATE_TRUNC('week', ${session.date}::timestamp)
    `)) as unknown as { rows?: { countBefore: number }[] };
    const rows = (cRes.rows ?? cRes) as unknown as { countBefore: number }[];
    const previousThisWeek = Number(rows[0]?.countBefore ?? 0);
    const weekPosition = previousThisWeek + 1;

    if (weekPosition === 1) {
      await db.execute(sql`UPDATE users SET cards_special_tokens = cards_special_tokens + 1 WHERE id = ${user.id}`);
      specials++;
    } else {
      await db.execute(sql`UPDATE users SET cards_tokens = cards_tokens + 1 WHERE id = ${user.id}`);
      normals++;
    }
  }

  // 6. Verify
  const fRes = (await db.execute(sql`
    SELECT cards_tokens, cards_special_tokens FROM users WHERE id = ${user.id}
  `)) as unknown as { rows?: { cards_tokens: number; cards_special_tokens: number }[] };
  const final = ((fRes.rows ?? fRes) as unknown as { cards_tokens: number; cards_special_tokens: number }[])[0];

  console.log(`  granted: +${specials} special · +${normals} normal`);
  console.log(`\n✓ Final: cards_tokens=${final.cards_tokens} · cards_special_tokens=${final.cards_special_tokens}`);
  console.log(`  expected:                         normals=${expectedNormals},  specials=${expectedSpecials}`);
  if (final.cards_tokens !== expectedNormals || final.cards_special_tokens !== expectedSpecials) {
    console.error(`  ⚠️  MISMATCH between expected and actual.`);
  } else {
    console.log(`  ✓ matches expectation\n`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
