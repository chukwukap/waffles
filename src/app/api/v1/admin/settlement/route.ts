import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createGameOnChain, endGameOnChain } from "@/lib/chain";
import { settleGame, updateMerkleRootOnChain } from "@/lib/chain/settlement";
import { getAdminSession } from "@/lib/admin-auth";

/**
 * Admin Settlement API
 *
 * Used by admin dashboard to manage games on-chain.
 * Protected by cookie-based session auth.
 */

// Auth check using existing session system
async function isAuthorized(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}

interface SettlementRequestBody {
  action: "create" | "end" | "settle" | "updateMerkleRoot" | "finalize";
  gameId: string;
  entryFee?: number; // Required for 'create' action
  newMerkleRoot?: string; // Required for 'updateMerkleRoot' action
}

interface SettlementResponse {
  success: boolean;
  action: string;
  gameId: string;
  txHash?: string;
  error?: string;
  merkleRoot?: string;
  winnersCount?: number;
  entriesRanked?: number;
  alreadyFinalized?: boolean;
}

/**
 * POST /api/v1/admin/settlement
 *
 * Actions:
 * - finalize: Calculate ranks and prizes in DB (if PartyKit failed to do this)
 * - create: Create game on-chain (gameId, entryFee required)
 * - end: End game on-chain (stop ticket sales)
 * - settle: Build Merkle tree from DB data and submit on-chain
 */
export async function POST(request: NextRequest) {
  // Auth check
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: SettlementRequestBody = await request.json();
    const { action, gameId, entryFee, newMerkleRoot } = body;

    if (!action || !gameId) {
      return NextResponse.json(
        { error: "Missing required fields: action, gameId" },
        { status: 400 }
      );
    }

    let txHash: `0x${string}` | undefined;
    let merkleRoot: `0x${string}` | undefined;
    let winnersCount: number | undefined;

    switch (action) {
      case "finalize": {
        // Manual trigger for finalize (if PartyKit failed)
        // This is idempotent - safe to call even if PartyKit already succeeded
        const { env } = await import("@/lib/env");
        const internalRes = await fetch(
          `${env.rootUrl}/api/v1/internal/games/${gameId}/finalize`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.partykitSecret}`,
            },
          }
        );

        if (!internalRes.ok) {
          const errorData = await internalRes.json();
          return NextResponse.json(
            { error: errorData.error || "Finalize failed" },
            { status: internalRes.status }
          );
        }

        const finalizeResult = await internalRes.json();
        return NextResponse.json<SettlementResponse>({
          success: true,
          action: "finalize",
          gameId,
          winnersCount: finalizeResult.prizesDistributed,
          entriesRanked: finalizeResult.entriesRanked,
          alreadyFinalized: finalizeResult.alreadyFinalized,
        });
      }

      case "create": {
        if (!entryFee) {
          return NextResponse.json(
            { error: "entryFee required for create action" },
            { status: 400 }
          );
        }
        // Fetch onchainId from database
        const createGame = await prisma.game.findUnique({
          where: { id: gameId },
          select: { onchainId: true },
        });
        if (!createGame?.onchainId) {
          return NextResponse.json(
            { error: "Game has no onchainId - cannot create on-chain" },
            { status: 400 }
          );
        }
        txHash = await createGameOnChain(
          createGame.onchainId as `0x${string}`,
          entryFee
        );
        break;
      }

      case "end": {
        // Fetch onchainId from database
        const endGame = await prisma.game.findUnique({
          where: { id: gameId },
          select: { onchainId: true },
        });
        if (!endGame?.onchainId) {
          return NextResponse.json(
            { error: "Game has no onchainId - cannot end on-chain" },
            { status: 400 }
          );
        }
        txHash = await endGameOnChain(endGame.onchainId as `0x${string}`);
        break;
      }

      case "settle": {
        const result = await settleGame(gameId);
        txHash = result.txHash;
        merkleRoot = result.merkleRoot;
        winnersCount = result.winners.length;
        break;
      }

      case "updateMerkleRoot": {
        if (!newMerkleRoot) {
          return NextResponse.json(
            { error: "newMerkleRoot required for updateMerkleRoot action" },
            { status: 400 }
          );
        }
        // Fetch onchainId from database
        const updateGame = await prisma.game.findUnique({
          where: { id: gameId },
          select: { onchainId: true },
        });
        if (!updateGame?.onchainId) {
          return NextResponse.json(
            { error: "Game has no onchainId - cannot update on-chain" },
            { status: 400 }
          );
        }
        txHash = await updateMerkleRootOnChain(
          updateGame.onchainId as `0x${string}`,
          newMerkleRoot as `0x${string}`
        );
        merkleRoot = newMerkleRoot as `0x${string}`;
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    const response: SettlementResponse = {
      success: true,
      action,
      gameId,
      txHash,
      merkleRoot,
      winnersCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Settlement API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Settlement failed",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/admin/settlement?gameId=X
 *
 * Check the on-chain status of a game
 */
export async function GET(request: NextRequest) {
  // Auth check
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const gameIdStr = searchParams.get("gameId");

    if (!gameIdStr) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 });
    }

    const gameId = gameIdStr;

    // Import dynamically to avoid issues when env var not set
    const { getOnChainGame } = await import("@/lib/chain");

    // Get database game to get onchainId
    const dbGame = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        onchainId: true,
        startsAt: true,
        endsAt: true,
        tierPrices: true,
        prizePool: true,
        playerCount: true,
      },
    });

    // Get on-chain game using onchainId
    let onChainGame = null;
    if (dbGame?.onchainId) {
      onChainGame = await getOnChainGame(dbGame.onchainId as `0x${string}`);
    }

    return NextResponse.json({
      gameId,
      onChain: onChainGame,
      database: dbGame,
    });
  } catch (error) {
    console.error("[Settlement API] GET Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get game status",
      },
      { status: 500 }
    );
  }
}
