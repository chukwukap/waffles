import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

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
 * User ticket information for a specific game
 */
export interface UserTicketInfo {
  hasTicket: boolean;
  ticketStatus: "pending" | "confirmed" | null;
  ticketId: number | null;
}

/**
 * GET /api/user/ticket?fid=<fid>&gameId=<gameId>
 * Fetches ticket information for a user and specific game
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

    console.log(`[Ticket API] Checking ticket for fid=${fid}, gameId=${gameId}`);

    // Find user by FID
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true },
    });

    if (!user) {
      console.log(`[Ticket API] User not found for fid=${fid}`);
      // Return default "no ticket" data if user not found
      return NextResponse.json<UserTicketInfo>({
        hasTicket: false,
        ticketStatus: null,
        ticketId: null,
      });
    }

    console.log(`[Ticket API] Found user id=${user.id} for fid=${fid}`);

    // Check if user has a ticket for this game
    const ticket = await prisma.ticket.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId: user.id,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!ticket) {
      console.log(`[Ticket API] No ticket found for userId=${user.id}, gameId=${gameId}`);
      // Also check if user has tickets for other games (for debugging)
      const allUserTickets = await prisma.ticket.findMany({
        where: { userId: user.id },
        select: { id: true, gameId: true, status: true },
      });
      console.log(`[Ticket API] User has ${allUserTickets.length} tickets total:`, allUserTickets);
      
      return NextResponse.json<UserTicketInfo>({
        hasTicket: false,
        ticketStatus: null,
        ticketId: null,
      });
    }

    console.log(`[Ticket API] Found ticket id=${ticket.id}, status=${ticket.status} for userId=${user.id}, gameId=${gameId}`);

    // Return ticket information
    return NextResponse.json<UserTicketInfo>({
      hasTicket: true,
      ticketStatus: ticket.status as "pending" | "confirmed",
      ticketId: ticket.id,
    });
  } catch (error) {
    console.error("GET /api/user/ticket Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
