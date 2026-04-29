import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

// Roue d'un jeton spécial : convertit en 1, 2, 3 ou 4 jetons normaux.
// Probabilités : 20% / 60% / 19% / 1%.
export const SPIN_OUTCOMES: { reward: 1 | 2 | 3 | 4; weight: number }[] = [
  { reward: 1, weight: 20 },
  { reward: 2, weight: 60 },
  { reward: 3, weight: 19 },
  { reward: 4, weight: 1 },
];

function rollSpin(): 1 | 2 | 3 | 4 {
  const total = SPIN_OUTCOMES.reduce((a, o) => a + o.weight, 0);
  let r = Math.random() * total;
  for (const o of SPIN_OUTCOMES) {
    r -= o.weight;
    if (r <= 0) return o.reward;
  }
  return 1;
}

// POST: spend 1 special token, roll the wheel, grant 1-4 normal tokens.
export async function POST() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Atomic decrement of special tokens
  const [decremented] = await db
    .update(users)
    .set({ cardsSpecialTokens: sql`${users.cardsSpecialTokens} - 1` })
    .where(and(eq(users.id, auth.userId), sql`${users.cardsSpecialTokens} >= 1`))
    .returning({ specialTokens: users.cardsSpecialTokens });

  if (!decremented) {
    return Response.json({ error: "Pas de jeton spécial disponible" }, { status: 400 });
  }

  const reward = rollSpin();

  const [updatedUser] = await db
    .update(users)
    .set({ cardsTokens: sql`${users.cardsTokens} + ${reward}` })
    .where(eq(users.id, auth.userId))
    .returning({ tokens: users.cardsTokens });

  return Response.json({
    reward,
    tokens: updatedUser?.tokens ?? 0,
    specialTokens: decremented.specialTokens,
  });
}
