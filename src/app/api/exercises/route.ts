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
        muscleGroup: groups[0] ?? null,
        muscleGroups: groups,
      };
    }),
  );
}

function normalizeGroups(input: unknown): string[] | undefined {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) return [];
  return input
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const groups =
    normalizeGroups(body.muscleGroups) ??
    (body.muscleGroup ? [body.muscleGroup.trim()] : []);

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
    const eg = resolveMuscleGroups(existing.muscleGroups, existing.muscleGroup);
    return Response.json({
      id: existing.id,
      name: existing.name,
      muscleGroup: eg[0] ?? null,
      muscleGroups: eg,
    });
  }

  const rg = resolveMuscleGroups(result.muscleGroups, result.muscleGroup);
  return Response.json(
    {
      id: result.id,
      name: result.name,
      muscleGroup: rg[0] ?? null,
      muscleGroups: rg,
    },
    { status: 201 },
  );
}
