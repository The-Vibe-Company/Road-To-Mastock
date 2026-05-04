/**
 * Re-grants special tokens for the 4th session of each ISO week.
 * Background: PR #8 mistakenly removed position-4 from the special-token
 * trigger. The fix re-introduced it. This script retroactively corrects
 * past terminations for a given user.
 *
 * For each session that was terminated AND was the 4th session of its
 * ISO week (by sessions.date), this script:
 *   1. clears `terminated_at` (keeps `tokens_granted_at` so re-terminate
 *      does NOT grant again — same semantics as DELETE /terminate)
 *   2. decrements cards_tokens by 1 and increments cards_special_tokens
 *      by 1, ONLY if the user still has at least 1 normal token (i.e.
 *      not already spent on a pack)
 *
 * Usage:
 *   npx tsx scripts/fix-fourth-session-specials.ts <email> [--write]
 *   (defaults to dry-run)
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

type SessionRow = {
  id: number;
  date: string;
  terminated_at: string | null;
  tokens_granted_at: string | null;
};

function isoWeekKey(dateStr: string) {
  // Match Postgres DATE_TRUNC('week', ...) — ISO weeks (Monday).
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay() || 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - (day - 1));
  return monday.toISOString().slice(0, 10);
}

async function processUser(
  db: ReturnType<typeof drizzle>,
  email: string,
  write: boolean,
) {
  const u = (await db.execute(sql`
    SELECT id, name, email, cards_tokens, cards_special_tokens
    FROM users WHERE email = ${email}
  `)) as unknown as {
    rows?: {
      id: number;
      name: string;
      email: string;
      cards_tokens: number;
      cards_special_tokens: number;
    }[];
  };
  const user = ((u.rows ?? u) as unknown as {
    id: number;
    name: string;
    email: string;
    cards_tokens: number;
    cards_special_tokens: number;
  }[])[0];

  console.log(`\n${"━".repeat(70)}`);
  if (!user) {
    console.log(`No user with email ${email} — skipping.`);
    return;
  }
  console.log(`User: ${user.name} <${user.email}> (id=${user.id})`);
  console.log(
    `Current balance: cards_tokens=${user.cards_tokens} · cards_special_tokens=${user.cards_special_tokens}`,
  );

  const sRes = (await db.execute(sql`
    SELECT id, date::text AS date,
           terminated_at::text AS terminated_at,
           tokens_granted_at::text AS tokens_granted_at
    FROM sessions
    WHERE user_id = ${user.id}
    ORDER BY date ASC, id ASC
  `)) as unknown as { rows?: SessionRow[] };
  const sessions = (sRes.rows ?? sRes) as unknown as SessionRow[];

  const weeks = new Map<string, SessionRow[]>();
  for (const s of sessions) {
    const k = isoWeekKey(s.date);
    if (!weeks.has(k)) weeks.set(k, []);
    weeks.get(k)!.push(s);
  }

  const targets: { session: SessionRow; weekKey: string }[] = [];
  for (const [k, rows] of weeks) {
    rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));
    if (rows.length >= 4) {
      const fourth = rows[3];
      if (fourth.tokens_granted_at) targets.push({ session: fourth, weekKey: k });
    }
  }

  if (targets.length === 0) {
    console.log(`No 4th-of-week sessions with tokens_granted — nothing to do.`);
    return;
  }

  console.log(`\nFound ${targets.length} 4ᵉ-de-semaine session(s) to correct:`);
  for (const { session, weekKey } of targets) {
    console.log(
      `  · session id=${session.id}  date=${session.date}  ISO-week=${weekKey}  ` +
        `terminated_at=${session.terminated_at ?? "NULL"}  tokens_granted_at=${session.tokens_granted_at}`,
    );
  }

  const swappable = Math.min(targets.length, user.cards_tokens);
  console.log(
    `\nPlan: déclôture ${targets.length} session(s) (clear terminated_at, keep tokens_granted_at).`,
  );
  console.log(
    `      Swap ${swappable}/${targets.length} normal → special (capped by current normal balance ${user.cards_tokens}).`,
  );

  if (!write) {
    console.log(`\n🔍 Dry-run only. Re-run with --write to apply.`);
    return;
  }

  for (const { session } of targets) {
    await db.execute(
      sql`UPDATE sessions SET terminated_at = NULL WHERE id = ${session.id} AND user_id = ${user.id}`,
    );
  }
  if (swappable > 0) {
    await db.execute(sql`
      UPDATE users
      SET cards_tokens = cards_tokens - ${swappable},
          cards_special_tokens = cards_special_tokens + ${swappable}
      WHERE id = ${user.id}
    `);
  }

  const fRes = (await db.execute(sql`
    SELECT cards_tokens, cards_special_tokens FROM users WHERE id = ${user.id}
  `)) as unknown as {
    rows?: { cards_tokens: number; cards_special_tokens: number }[];
  };
  const final = ((fRes.rows ?? fRes) as unknown as {
    cards_tokens: number;
    cards_special_tokens: number;
  }[])[0];
  console.log(
    `\n✓ Done. New balance: cards_tokens=${final.cards_tokens} · cards_special_tokens=${final.cards_special_tokens}`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const emails = args.filter((a) => !a.startsWith("--"));
  if (emails.length === 0) {
    console.error(
      "Usage: npx tsx scripts/fix-fourth-session-specials.ts <email> [<email>…] [--write]",
    );
    process.exit(1);
  }

  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  console.log(`Mode: ${write ? "✏️  WRITE (DB will be modified)" : "🔍 DRY RUN"}`);
  for (const email of emails) {
    await processUser(db, email, write);
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
