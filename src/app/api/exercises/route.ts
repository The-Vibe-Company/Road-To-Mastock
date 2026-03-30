import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { asc, ilike, or } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
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

  return Response.json(result);
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const [result] = await db
    .insert(exercises)
    .values({
      name: body.name.trim(),
      muscleGroup: body.muscleGroup?.trim() || null,
    })
    .onConflictDoNothing()
    .returning();

  if (!result) {
    // Exercise already exists, find and return it
    const [existing] = await db
      .select()
      .from(exercises)
      .where(ilike(exercises.name, body.name.trim()));
    return Response.json(existing);
  }

  return Response.json(result, { status: 201 });
}
