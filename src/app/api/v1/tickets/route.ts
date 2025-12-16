import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
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

interface EntryResponse {
  id: number;
  status: string;
  amountUSDC: number;
  gameId: number;
  paidAt: Date | null;
  createdAt: Date;
}

/**
 * POST /api/v1/tickets
 * Purchase a ticket (game entry) for a game (auth required)
 * Uses GameEntry model instead of deprecated Ticket model
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
      select: {
        id: true,
        ticketPrice: true,
        maxPlayers: true,
        playerCount: true,
      },
    });

    if (!game) {
      return NextResponse.json<ApiError>(
        { error: "Game not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check if game is full
    if (game.maxPlayers > 0 && game.playerCount >= game.maxPlayers) {
      return NextResponse.json<ApiError>(
        { error: "Game is full", code: "GAME_FULL" },
        { status: 400 }
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
        // Check if txHash already used
        const existingEntry = await prisma.gameEntry.findFirst({
          where: { txHash },
        });

        if (
          existingEntry &&
          (existingEntry.userId !== auth.userId ||
            existingEntry.gameId !== gameId)
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

    // Check for existing entry (idempotency)
    const existingEntry = await prisma.gameEntry.findUnique({
      where: { gameId_userId: { gameId, userId: auth.userId } },
    });

    if (existingEntry) {
      // Update if transaction verified and entry not yet paid
      if (txHash && !existingEntry.paidAt && isVerified) {
        const updatedEntry = await prisma.gameEntry.update({
          where: { id: existingEntry.id },
          data: { txHash, paidAt: new Date() },
        });

        return NextResponse.json<EntryResponse>({
          id: updatedEntry.id,
          status: "PAID",
          amountUSDC: game.ticketPrice,
          gameId: updatedEntry.gameId,
          paidAt: updatedEntry.paidAt,
          createdAt: updatedEntry.createdAt,
        });
      }

      return NextResponse.json<EntryResponse>({
        id: existingEntry.id,
        status: existingEntry.paidAt ? "PAID" : "PENDING",
        amountUSDC: game.ticketPrice,
        gameId: existingEntry.gameId,
        paidAt: existingEntry.paidAt,
        createdAt: existingEntry.createdAt,
      });
    }

    // Create new entry
    const paidAt = isVerified ? new Date() : null;

    const newEntry = await prisma.$transaction(async (tx) => {
      const entry = await tx.gameEntry.create({
        data: {
          userId: auth.userId,
          gameId,
          txHash: txHash ?? null,
          paidAt,
          score: 0,
          answered: 0,
          answers: {},
        },
      });

      // Update game player count if paid
      if (paidAt) {
        await tx.game.update({
          where: { id: gameId },
          data: {
            playerCount: { increment: 1 },
            prizePool: { increment: game.ticketPrice },
          },
        });
      }

      return entry;
    });

    return NextResponse.json<EntryResponse>(
      {
        id: newEntry.id,
        status: newEntry.paidAt ? "PAID" : "PENDING",
        amountUSDC: game.ticketPrice,
        gameId: newEntry.gameId,
        paidAt: newEntry.paidAt,
        createdAt: newEntry.createdAt,
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
        { error: "Entry already exists", code: "CONFLICT" },
        { status: 409 }
      );
    }

    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
});
