/**
 * Grants tokens to a user. Supports both normal and special tokens.
 *
 * Usage:
 *   npx tsx scripts/grant-tokens.ts <email> <normalCount> [specialCount]
 *
 * Examples:
 *   npx tsx scripts/grant-tokens.ts antoine@quivr.app 10        // +10 normal
 *   npx tsx scripts/grant-tokens.ts antoine@quivr.app 10 5      // +10 normal, +5 special
 *   npx tsx scripts/grant-tokens.ts antoine@quivr.app 0 5       // +0 normal, +5 special
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local", override: true });

async function main() {
  const email = process.argv[2];
  const normal = parseInt(process.argv[3] ?? "0");
  const special = parseInt(process.argv[4] ?? "0");
  if (!email || (Number.isNaN(normal) && Number.isNaN(special))) {
    console.error("Usage: npx tsx scripts/grant-tokens.ts <email> <normalCount> [specialCount]");
    process.exit(1);
  }

  const dbSql = neon(process.env.DATABASE_URL!);
  const db = drizzle(dbSql);

  const result = (await db.execute(sql`
    UPDATE users SET
      cards_tokens = cards_tokens + ${normal},
      cards_special_tokens = cards_special_tokens + ${special}
    WHERE email = ${email}
    RETURNING id, name, cards_tokens, cards_special_tokens
  `)) as unknown as {
    rows?: { id: number; name: string; cards_tokens: number; cards_special_tokens: number }[];
  };
  const updated = ((result.rows ?? result) as unknown as {
    id: number; name: string; cards_tokens: number; cards_special_tokens: number;
  }[])[0];

  if (!updated) {
    console.error(`No user with email ${email}`);
    process.exit(1);
  }

  console.log(
    `+${normal} jetons normaux, +${special} jetons spéciaux → ${updated.name} <${email}>`,
  );
  console.log(
    `  totals: ${updated.cards_tokens} normaux · ${updated.cards_special_tokens} spéciaux`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
