/**
 * Game Lifecycle API
 *
 * Unified endpoint for managing game lifecycle transitions:
 * - start: SCHEDULED → LIVE
 * - end: LIVE → ENDED (DB + on-chain)
 * - settle: ENDED → SETTLED (submit Merkle root)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAdminAction, AdminAction, EntityType } from "@/lib/audit";
import {
  endGameOnChain,
  settleGame,
  getOnChainGame,
} from "@/lib/settlement";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAdminSession();
    if (!authResult.authenticated || !authResult.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, gameId } = body;

    if (!gameId || !action) {
      return NextResponse.json(
        { error: "Missing gameId or action" },
        { status: 400 }
      );
    }

    // Fetch game data
    const game = await prisma.game.findUnique({
      where: { id: Number(gameId) },
      include: {
        _count: {
          select: { players: true, questions: true },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Handle each action
    switch (action) {
      case "start":
        return handleStartGame(game, authResult.session.userId);

      case "end":
        return handleEndGame(game, authResult.session.userId);

      case "settle":
        return handleSettleGame(game, authResult.session.userId);

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Game Lifecycle API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Start Game: SCHEDULED → LIVE
 */
async function handleStartGame(
  game: {
    id: number;
    title: string;
    status: string;
    _count: { players: number; questions: number };
  },
  adminId: string
) {
  // Validation
  if (game.status !== "SCHEDULED") {
    return NextResponse.json(
      { error: `Cannot start game with status: ${game.status}` },
      { status: 400 }
    );
  }

  if (game._count.questions === 0) {
    return NextResponse.json(
      { error: "Cannot start game without questions" },
      { status: 400 }
    );
  }

  // Update database
  await prisma.game.update({
    where: { id: game.id },
    data: { status: "LIVE" },
  });

  // Log action
  await logAdminAction({
    adminId,
    action: AdminAction.UPDATE_GAME,
    entityType: EntityType.GAME,
    entityId: game.id,
    details: { status: "LIVE", title: game.title },
  });

  revalidatePath("/admin/games");
  revalidatePath(`/admin/games/${game.id}`);

  return NextResponse.json({
    success: true,
    message: "Game started successfully",
    newStatus: "LIVE",
  });
}

/**
 * End Game: LIVE → ENDED
 * - Updates database status
 * - Calculates player rankings
 * - Ends game on-chain (stops ticket sales)
 */
async function handleEndGame(
  game: {
    id: number;
    title: string;
    status: string;
    _count: { players: number; questions: number };
  },
  adminId: string
) {
  // Validation - allow ending from LIVE or syncing from ENDED
  if (game.status !== "LIVE" && game.status !== "ENDED") {
    return NextResponse.json(
      { error: `Cannot end game with status: ${game.status}` },
      { status: 400 }
    );
  }

  let txHash: string | undefined;
  let playersRanked = 0;

  // If game is still LIVE, update DB first
  if (game.status === "LIVE") {
    // Update database status
    await prisma.game.update({
      where: { id: game.id },
      data: { status: "ENDED" },
    });

    // Calculate and persist rankings
    const players = await prisma.gamePlayer.findMany({
      where: { gameId: game.id },
      orderBy: [
        { score: "desc" },
        { joinedAt: "asc" }, // Tie-breaker: earlier joiner wins
      ],
      select: { id: true },
    });

    playersRanked = players.length;

    // Update ranks in a transaction
    if (players.length > 0) {
      await prisma.$transaction(
        players.map((player, index) =>
          prisma.gamePlayer.update({
            where: { id: player.id },
            data: { rank: index + 1 },
          })
        )
      );
    }
  }

  // End game on-chain
  try {
    // Check if game exists on-chain first
    const onChainGame = await getOnChainGame(game.id);
    if (onChainGame) {
      const gameData = onChainGame as { ended: boolean };
      if (!gameData.ended) {
        txHash = await endGameOnChain(game.id);
        console.log(`[Game Lifecycle] Ended game ${game.id} on-chain. TX: ${txHash}`);
      }
    }
  } catch (onChainError) {
    console.error(`[Game Lifecycle] On-chain end failed for game ${game.id}:`, onChainError);
    // Don't fail the request - the DB update succeeded
    // Admin can retry the on-chain operation
  }

  // Log action
  await logAdminAction({
    adminId,
    action: AdminAction.UPDATE_GAME,
    entityType: EntityType.GAME,
    entityId: game.id,
    details: {
      status: "ENDED",
      title: game.title,
      playersRanked,
      onChainTx: txHash,
    },
  });

  revalidatePath("/admin/games");
  revalidatePath(`/admin/games/${game.id}`);

  return NextResponse.json({
    success: true,
    message: "Game ended successfully",
    newStatus: "ENDED",
    playersRanked,
    txHash,
  });
}

/**
 * Settle Game: ENDED → SETTLED
 * - Calculates winners (top 3)
 * - Builds Merkle tree
 * - Submits to blockchain
 */
async function handleSettleGame(
  game: {
    id: number;
    title: string;
    status: string;
    _count: { players: number; questions: number };
  },
  adminId: string
) {
  // Validation
  if (game.status !== "ENDED") {
    return NextResponse.json(
      { error: `Cannot settle game with status: ${game.status}. Game must be ENDED first.` },
      { status: 400 }
    );
  }

  // Check on-chain status
  const onChainGame = await getOnChainGame(game.id);
  if (!onChainGame) {
    return NextResponse.json(
      { error: "Game is not registered on-chain" },
      { status: 400 }
    );
  }

  const gameData = onChainGame as { ended: boolean; merkleRoot: string };
  if (!gameData.ended) {
    return NextResponse.json(
      { error: "Game has not been ended on-chain yet" },
      { status: 400 }
    );
  }

  // Check if already settled
  const zeroRoot = "0x0000000000000000000000000000000000000000000000000000000000000000";
  if (gameData.merkleRoot !== zeroRoot) {
    return NextResponse.json(
      { error: "Game has already been settled" },
      { status: 400 }
    );
  }

  // Execute settlement
  const { merkleRoot, winners, txHash } = await settleGame(game.id);

  // Log action
  await logAdminAction({
    adminId,
    action: AdminAction.UPDATE_GAME,
    entityType: EntityType.GAME,
    entityId: game.id,
    details: {
      action: "SETTLE",
      title: game.title,
      winnersCount: winners.length,
      merkleRoot,
      onChainTx: txHash,
    },
  });

  revalidatePath("/admin/games");
  revalidatePath(`/admin/games/${game.id}`);

  return NextResponse.json({
    success: true,
    message: "Game settled successfully",
    winnersCount: winners.length,
    merkleRoot,
    txHash,
  });
}

