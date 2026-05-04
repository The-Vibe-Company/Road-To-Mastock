import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { asc, ilike, or } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { resolveMuscleGroups } from "@/lib/muscle-groups";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");

  const result = await db
    .select()
    .from(exercises)
    .where(q ? or(ilike(exercises.name, `%${q}%`)) : undefined)
    .orderBy(asc(exercises.name));

  return Response.json(
    result.map((e) => {
      const groups = resolveMuscleGroups(e.muscleGroups, e.muscleGroup);
      return {
        id: e.id,
        name: e.name,
        kind: e.kind ?? "muscu",
        muscleGroup: groups[0] ?? null,
        muscleGroups: groups,
      };
    }),
  );
}

function normalizeGroups(input: unknown): string[] | undefined {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) return undefined;
  const cleaned = input
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
  return Array.from(new Set(cleaned));
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const fallbackSingle =
    typeof body.muscleGroup === "string" ? body.muscleGroup.trim() : "";
  const normalized = normalizeGroups(body.muscleGroups);
  const groups =
    normalized && normalized.length > 0
      ? normalized
      : fallbackSingle
        ? [fallbackSingle]
        : [];

  const [result] = await db
    .insert(exercises)
    .values({
      name: body.name.trim(),
      muscleGroup: groups[0] ?? null,
      muscleGroups: groups,
    })
    .onConflictDoNothing()
    .returning();

  if (!result) {
    const [existing] = await db
      .select()
      .from(exercises)
      .where(ilike(exercises.name, body.name.trim()));
    if (!existing) {
      return Response.json({ error: "Conflict resolution failed" }, { status: 500 });
    }
    const eg = resolveMuscleGroups(existing.muscleGroups, existing.muscleGroup);
    return Response.json({
      id: existing.id,
      name: existing.name,
      kind: existing.kind ?? "muscu",
      muscleGroup: eg[0] ?? null,
      muscleGroups: eg,
    });
  }

  const rg = resolveMuscleGroups(result.muscleGroups, result.muscleGroup);
  return Response.json(
    {
      id: result.id,
      name: result.name,
      kind: result.kind ?? "muscu",
      muscleGroup: rg[0] ?? null,
      muscleGroups: rg,
    },
    { status: 201 },
  );
}
