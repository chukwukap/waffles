import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createGameOnChain,
  endGameOnChain,
  settleGame,
} from "@/lib/settlement";
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
  action: "create" | "end" | "settle";
  gameId: number;
  entryFee?: number; // Required for 'create' action
}

interface SettlementResponse {
  success: boolean;
  action: string;
  gameId: number;
  txHash?: string;
  error?: string;
  merkleRoot?: string;
  winnersCount?: number;
}

/**
 * POST /api/v1/admin/settlement
 *
 * Actions:
 * - create: Create game on-chain (gameId, entryFee required)
 * - end: End game on-chain (stop ticket sales)
 * - settle: Calculate winners and submit Merkle root
 */
export async function POST(request: NextRequest) {
  // Auth check
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: SettlementRequestBody = await request.json();
    const { action, gameId, entryFee } = body;

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
      case "create": {
        if (!entryFee) {
          return NextResponse.json(
            { error: "entryFee required for create action" },
            { status: 400 }
          );
        }
        txHash = await createGameOnChain(gameId, entryFee);
        break;
      }

      case "end": {
        txHash = await endGameOnChain(gameId);
        break;
      }

      case "settle": {
        const result = await settleGame(gameId);
        txHash = result.txHash;
        merkleRoot = result.merkleRoot;
        winnersCount = result.winners.length;
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

    const gameId = parseInt(gameIdStr);

    // Import dynamically to avoid issues when env var not set
    const { getOnChainGame } = await import("@/lib/settlement");
    const onChainGame = await getOnChainGame(gameId);

    // Get database game for comparison
    const dbGame = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        status: true,
        entryFee: true,
        prizePool: true,
        _count: {
          select: { tickets: true },
        },
      },
    });

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
