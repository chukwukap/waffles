import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const getQuerySchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be integer")
    .default("50")
    .transform(Number)
    .optional(),
});

// ====================================================================
// GET /api/game - Fetch a list of games (e.g., for admin or overview)
// ====================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const queryValidation = getQuerySchema.safeParse({
      limit: searchParams.get("limit"),
    });

    if (!queryValidation.success) {
      const firstError =
        queryValidation.error.message || "Invalid query parameters";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    const { limit } = queryValidation.data;

    const games = await prisma.game.findMany({
      orderBy: { startTime: "asc" },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        startTime: true,
        endTime: true,
        createdAt: true,
      },
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("GET /api/game Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
