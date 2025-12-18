import { NextResponse } from "next/server";
import { createPublicClient, http, decodeEventLog, type Hex } from "viem";
import { base, baseSepolia } from "viem/chains";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WAFFLE_GAME_CONFIG, CHAIN_CONFIG } from "@/lib/contracts/config";
import waffleGameAbi from "@/lib/contracts/WaffleGameAbi.json";

type Params = { gameId: string };

// Create public client for on-chain verification
const publicClient = createPublicClient({
  chain: CHAIN_CONFIG.isMainnet ? base : baseSepolia,
  transport: http(),
});

// TicketPurchased event signature
const TICKET_PURCHASED_TOPIC = "0x" as Hex; // Will be matched by ABI decoding

/**
 * Verify a ticket purchase transaction on-chain
 * Returns the decoded event data if valid, null otherwise
 */
async function verifyTicketPurchase(
  txHash: Hex,
  expectedGameId: number,
  expectedBuyer: string
): Promise<{ gameId: bigint; player: string; amount: bigint } | null> {
  try {
    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

    if (!receipt || receipt.status !== "success") {
      console.error("[verifyTicketPurchase] Transaction not successful");
      return null;
    }

    // Verify the transaction was to the WaffleGame contract
    if (
      receipt.to?.toLowerCase() !== WAFFLE_GAME_CONFIG.address.toLowerCase()
    ) {
      console.error("[verifyTicketPurchase] Wrong contract address");
      return null;
    }

    // Find TicketPurchased event in logs
    for (const log of receipt.logs) {
      // Only check logs from our contract
      if (
        log.address.toLowerCase() !== WAFFLE_GAME_CONFIG.address.toLowerCase()
      ) {
        continue;
      }

      try {
        const decoded = decodeEventLog({
          abi: waffleGameAbi,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "TicketPurchased" && decoded.args) {
          const args = decoded.args as unknown as {
            gameId: bigint;
            player: string;
            amount: bigint;
          };

          // Verify gameId matches
          if (Number(args.gameId) !== expectedGameId) {
            console.error(
              "[verifyTicketPurchase] Game ID mismatch:",
              args.gameId,
              "vs",
              expectedGameId
            );
            continue;
          }

          // Verify buyer matches (case-insensitive)
          if (args.player.toLowerCase() !== expectedBuyer.toLowerCase()) {
            console.error(
              "[verifyTicketPurchase] Buyer mismatch:",
              args.player,
              "vs",
              expectedBuyer
            );
            continue;
          }

          // All checks passed
          return {
            gameId: args.gameId,
            player: args.player,
            amount: args.amount,
          };
        }
      } catch {
        // Not our event, continue
        continue;
      }
    }

    console.error("[verifyTicketPurchase] TicketPurchased event not found");
    return null;
  } catch (error) {
    console.error("[verifyTicketPurchase] Error:", error);
    return null;
  }
}

/**
 * GET /api/v1/games/:gameId/entry
 * Get the current user's entry for a specific game.
 */
export const GET = withAuth<Params>(
  async (request, auth: AuthResult, params) => {
    try {
      const gameId = parseInt(params.gameId, 10);

      if (isNaN(gameId)) {
        return NextResponse.json<ApiError>(
          { error: "Invalid game ID", code: "INVALID_INPUT" },
          { status: 400 }
        );
      }

      const entry = await prisma.gameEntry.findUnique({
        where: {
          gameId_userId: {
            gameId,
            userId: auth.userId,
          },
        },
        select: {
          id: true,
          score: true,
          answered: true,
          paidAt: true,
          paidAmount: true,
          rank: true,
          prize: true,
          createdAt: true,
        },
      });

      if (!entry) {
        return NextResponse.json<ApiError>(
          { error: "Entry not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      return NextResponse.json(entry);
    } catch (error) {
      console.error("GET /api/v1/games/:gameId/entry Error:", error);
      return NextResponse.json<ApiError>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/v1/games/:gameId/entry
 * Create a new entry for a game after on-chain payment verification.
 */
export const POST = withAuth<Params>(
  async (request, auth: AuthResult, params) => {
    try {
      const gameId = parseInt(params.gameId, 10);

      if (isNaN(gameId)) {
        return NextResponse.json<ApiError>(
          { error: "Invalid game ID", code: "INVALID_INPUT" },
          { status: 400 }
        );
      }

      const body = await request.json();
      const { txHash, paidAmount } = body;

      if (!txHash || typeof txHash !== "string") {
        return NextResponse.json<ApiError>(
          { error: "Transaction hash is required", code: "INVALID_INPUT" },
          { status: 400 }
        );
      }

      if (typeof paidAmount !== "number" || paidAmount <= 0) {
        return NextResponse.json<ApiError>(
          { error: "Valid paidAmount is required", code: "INVALID_INPUT" },
          { status: 400 }
        );
      }

      // Check if entry already exists
      const existing = await prisma.gameEntry.findUnique({
        where: {
          gameId_userId: {
            gameId,
            userId: auth.userId,
          },
        },
      });

      if (existing) {
        // Entry already exists - return success (idempotent)
        return NextResponse.json(existing, { status: 200 });
      }

      // Verify game exists and is not ended
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          endsAt: true,
          playerCount: true,
          maxPlayers: true,
          tierPrices: true,
        },
      });

      if (!game) {
        return NextResponse.json<ApiError>(
          { error: "Game not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // Get user's wallet address for on-chain verification
      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { wallet: true },
      });

      // Verify the transaction on-chain if user has wallet
      if (user?.wallet) {
        const verified = await verifyTicketPurchase(
          txHash as Hex,
          gameId,
          user.wallet
        );

        if (!verified) {
          return NextResponse.json<ApiError>(
            {
              error: "Transaction verification failed",
              code: "VERIFICATION_FAILED",
            },
            { status: 400 }
          );
        }

        // Validate that paid amount matches one of the tier prices
        const verifiedAmount = Number(verified.amount) / 1e6; // Convert from USDC decimals
        if (!game.tierPrices.includes(verifiedAmount)) {
          return NextResponse.json<ApiError>(
            {
              error: "Invalid tier amount",
              code: "INVALID_TIER",
            },
            { status: 400 }
          );
        }
      }

      // Game time/capacity checks
      if (new Date() >= game.endsAt) {
        return NextResponse.json<ApiError>(
          { error: "Game has ended", code: "GAME_ENDED" },
          { status: 400 }
        );
      }

      if (game.playerCount >= game.maxPlayers) {
        return NextResponse.json<ApiError>(
          { error: "Game is full", code: "GAME_FULL" },
          { status: 400 }
        );
      }

      // Create entry and update game counters atomically
      const entry = await prisma.$transaction(async (tx) => {
        const newEntry = await tx.gameEntry.create({
          data: {
            gameId,
            userId: auth.userId,
            txHash,
            paidAmount,
            paidAt: new Date(),
          },
        });

        await tx.game.update({
          where: { id: gameId },
          data: {
            playerCount: { increment: 1 },
            prizePool: { increment: paidAmount },
          },
        });

        return newEntry;
      });

      return NextResponse.json(entry, { status: 201 });
    } catch (error) {
      console.error("POST /api/v1/games/:gameId/entry Error:", error);
      return NextResponse.json<ApiError>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
);
