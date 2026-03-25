import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const muscleGroup = searchParams.get("muscle_group");

  const conditions = [];
  if (category) conditions.push(eq(exercises.category, category));
  if (muscleGroup) conditions.push(eq(exercises.muscleGroup, muscleGroup));

  const result = await db
    .select()
    .from(exercises)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(exercises.category), asc(exercises.muscleGroup), asc(exercises.sortOrder));

  return Response.json(result);
}
