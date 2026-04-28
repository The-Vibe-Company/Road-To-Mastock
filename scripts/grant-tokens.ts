/**
 * Grants N cards_tokens to a user. Useful for debug/testing.
 *
 * Usage: npx tsx scripts/grant-tokens.ts <email> <count>
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local", override: true });

async function main() {
  const email = process.argv[2];
  const count = parseInt(process.argv[3] ?? "99");
  if (!email) {
    console.error("Usage: npx tsx scripts/grant-tokens.ts <email> [count]");
    process.exit(1);
  }

  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  const result = (await db.execute(sql`
    UPDATE users SET cards_tokens = cards_tokens + ${count}
    WHERE email = ${email}
    RETURNING id, name, cards_tokens
  `)) as unknown as { rows?: { id: number; name: string; cards_tokens: number }[] };
  const updated = ((result.rows ?? result) as unknown as { id: number; name: string; cards_tokens: number }[])[0];

  if (!updated) {
    console.error(`No user with email ${email}`);
    process.exit(1);
  }

  console.log(`+${count} jetons → ${updated.name} <${email}> (total: ${updated.cards_tokens})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
