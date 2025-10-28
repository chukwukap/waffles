import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const querySchema = z.object({
  gameId: z.string().regex(/^\d+$/, "Invalid gameId format").transform(Number),
});

export async function GET(request: NextRequest) {
  try {
    const farcasterId = request.headers.get("x-farcaster-id");
    if (!farcasterId) {
      return NextResponse.json(
        { valid: false, message: "Unauthorized: Missing Farcaster ID header" },
        { status: 401 }
      );
    }
    if (!/^\d+$/.test(farcasterId)) {
      return NextResponse.json(
        { valid: false, message: "Unauthorized: Invalid Farcaster ID format" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const gameIdParam = searchParams.get("gameId");

    const validationResult = querySchema.safeParse({ gameId: gameIdParam });

    if (!validationResult.success) {
      const firstError =
        validationResult.error.message || "Invalid or missing gameId";
      return NextResponse.json(
        { valid: false, message: firstError },
        { status: 400 }
      );
    }
    const { gameId } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: { fid: Number(farcasterId) },
    });
    if (!user) {
      return NextResponse.json(
        { valid: false, message: "User not found" },
        { status: 404 }
      );
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        userId: user.id,
        gameId,
        status: "confirmed",
      },
    });

    if (!ticket) {
      return NextResponse.json({
        valid: false,
        message: "Ticket not found for this game",
      });
    }

    return NextResponse.json({ valid: true, ticketId: ticket.id });
  } catch (error) {
    console.error("Error verifying ticket:", error);
    return NextResponse.json(
      { valid: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Ensure dynamic execution for fresh ticket verification data
export const dynamic = "force-dynamic";
