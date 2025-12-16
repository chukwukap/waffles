import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { randomBytes } from "crypto";
import { createPublicClient, http, isHash } from "viem";
import { base } from "viem/chains";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎟️ FREE TICKETS MODE - For Testing Only
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FREE_TICKETS_MODE = true;

const purchaseSchema = z.object({
  gameId: z.number().int().positive("Invalid Game ID"),
  txHash: z.string().optional().nullable(),
});

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

interface TicketResponse {
  id: number;
  code: string;
  status: string;
  amountUSDC: number;
  gameId: number;
  purchasedAt: Date;
}

/**
 * POST /api/v1/tickets
 * Purchase a ticket for a game (auth required)
 */
export const POST = withAuth(async (request, auth: AuthResult) => {
  try {
    const body = await request.json();
    const validation = purchaseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiError>(
        {
          error: validation.error.issues[0]?.message || "Invalid input",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { gameId, txHash } = validation.data;

    // Check user status
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, hasGameAccess: true, isBanned: true, wallet: true },
    });

    if (!user || !user.hasGameAccess || user.isBanned) {
      return NextResponse.json<ApiError>(
        {
          error: "Access denied. You must be invited to play.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // Find Game
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, entryFee: true },
    });

    if (!game) {
      return NextResponse.json<ApiError>(
        { error: "Game not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Verify Transaction
    let isVerified = false;

    if (FREE_TICKETS_MODE) {
      isVerified = true;
    } else if (txHash) {
      if (!isHash(txHash)) {
        return NextResponse.json<ApiError>(
          { error: "Invalid transaction hash format", code: "INVALID_TX" },
          { status: 400 }
        );
      }

      try {
        const existingTx = await prisma.ticket.findFirst({
          where: { txHash },
        });

        if (
          existingTx &&
          (existingTx.userId !== auth.userId || existingTx.gameId !== gameId)
        ) {
          return NextResponse.json<ApiError>(
            { error: "Transaction hash already used", code: "TX_REUSED" },
            { status: 400 }
          );
        }

        const receipt = await publicClient.getTransactionReceipt({
          hash: txHash,
        });

        if (receipt.status !== "success") {
          return NextResponse.json<ApiError>(
            { error: "Transaction failed on-chain", code: "TX_FAILED" },
            { status: 400 }
          );
        }

        isVerified = true;
      } catch {
        return NextResponse.json<ApiError>(
          { error: "Failed to verify transaction", code: "TX_VERIFY_FAILED" },
          { status: 400 }
        );
      }
    }

    // Check for existing ticket (idempotency)
    const existingTicket = await prisma.ticket.findUnique({
      where: { gameId_userId: { gameId, userId: auth.userId } },
    });

    if (existingTicket) {
      if (txHash && existingTicket.txHash !== txHash && isVerified) {
        const updatedTicket = await prisma.ticket.update({
          where: { id: existingTicket.id },
          data: { txHash, status: "PAID" },
        });

        return NextResponse.json<TicketResponse>({
          id: updatedTicket.id,
          code: updatedTicket.code,
          status: updatedTicket.status,
          amountUSDC: updatedTicket.amountUSDC,
          gameId: updatedTicket.gameId,
          purchasedAt: updatedTicket.purchasedAt,
        });
      }

      return NextResponse.json<TicketResponse>({
        id: existingTicket.id,
        code: existingTicket.code,
        status: existingTicket.status,
        amountUSDC: existingTicket.amountUSDC,
        gameId: existingTicket.gameId,
        purchasedAt: existingTicket.purchasedAt,
      });
    }

    // Generate unique code
    let code: string = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      code = randomBytes(6).toString("hex").toUpperCase();
      const exists = await prisma.ticket.findUnique({ where: { code } });
      if (!exists) break;
      if (attempt === 9) {
        return NextResponse.json<ApiError>(
          {
            error: "Could not generate unique ticket code",
            code: "CODE_GEN_FAILED",
          },
          { status: 500 }
        );
      }
    }

    const status = isVerified ? "PAID" : "PENDING";

    const newTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          userId: auth.userId,
          gameId,
          amountUSDC: game.entryFee,
          code,
          txHash: txHash ?? null,
          status,
        },
      });

      await tx.gamePlayer.upsert({
        where: { gameId_userId: { gameId, userId: auth.userId } },
        update: {},
        create: { gameId, userId: auth.userId, score: 0 },
      });

      return ticket;
    });

    return NextResponse.json<TicketResponse>(
      {
        id: newTicket.id,
        code: newTicket.code,
        status: newTicket.status,
        amountUSDC: newTicket.amountUSDC,
        gameId: newTicket.gameId,
        purchasedAt: newTicket.purchasedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/v1/tickets Error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json<ApiError>(
        { error: "Ticket already exists", code: "CONFLICT" },
        { status: 409 }
      );
    }

    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
});
