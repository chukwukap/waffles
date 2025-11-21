import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import type { Ticket } from "../../../../../../../prisma/generated/client";

// Query parameter validation schema
const querySchema = z.object({
  fid: z
    .string()
    .regex(/^\d+$/, "FID must be a numeric string")
    .transform(Number),
  gameId: z
    .string()
    .regex(/^\d+$/, "Game ID must be a numeric string")
    .transform(Number),
});

/**
 * GET /api/user/ticket?fid=<fid>&gameId=<gameId>
 * Fetches ticket for a user and specific game
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get("fid");
    const gameIdParam = searchParams.get("gameId");

    // Validate query parameters
    const validationResult = querySchema.safeParse({
      fid: fidParam,
      gameId: gameIdParam,
    });

    if (!validationResult.success) {
      const firstError =
        validationResult.error.issues[0]?.message ||
        "Invalid or missing parameters";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { fid, gameId } = validationResult.data;

    // Find user by FID
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true, status: true }, // Added status
    });

    if (!user) {
      return NextResponse.json<Ticket | null>(null);
    }

    // Enforce access control
    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if user has a ticket for this game
    const ticket = await prisma.ticket.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId: user.id,
        },
      },
    });

    if (!ticket) {
      return NextResponse.json<Ticket | null>(null);
    }

    // Return ticket information
    return NextResponse.json<Ticket | null>(ticket);
  } catch (error) {
    console.error("GET /api/user/ticket Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
