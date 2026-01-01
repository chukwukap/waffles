"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction, AdminAction, EntityType } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createGameOnChain,
  generateOnchainGameId,
  getOnChainGame,
} from "@/lib/chain";
import { getGamePhase } from "@/lib/types";
import { env } from "@/lib/env";

// ==========================================
// SCHEMA (Updated for new model)
// ==========================================

const gameSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  theme: z.enum([
    "FOOTBALL",
    "MOVIES",
    "ANIME",
    "POLITICS",
    "CRYPTO",
    "GENERAL",
  ]),
  coverUrl: z.string().optional().nullable(),
  startsAt: z.string().transform((str) => new Date(str)),
  endsAt: z.string().transform((str) => new Date(str)),
  tierPrice1: z.coerce.number().min(0, "Tier price must be non-negative"),
  tierPrice2: z.coerce.number().min(0, "Tier price must be non-negative"),
  tierPrice3: z.coerce.number().min(0, "Tier price must be non-negative"),
  roundBreakSec: z.coerce
    .number()
    .min(5, "Duration must be at least 5 seconds"),
  maxPlayers: z.coerce.number().min(2, "Must allow at least 2 players"),
});

export type GameActionResult =
  | { success: true; gameId?: number }
  | { success: false; error: string };

// ==========================================
// CREATE GAME
// ==========================================

export async function createGameAction(
  _prevState: GameActionResult | null,
  formData: FormData
): Promise<GameActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    theme: formData.get("theme"),
    coverUrl: formData.get("coverUrl"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    tierPrice1: formData.get("tierPrice1"),
    tierPrice2: formData.get("tierPrice2"),
    tierPrice3: formData.get("tierPrice3"),
    roundBreakSec: formData.get("roundBreakSec"),
    maxPlayers: formData.get("maxPlayers"),
  };

  const validation = gameSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid input",
    };
  }

  const data = validation.data;

  try {
    // Check if there's already an active game (not ended in database)
    const now = new Date();
    const existingActiveGame = await prisma.game.findFirst({
      where: {
        endsAt: { gt: now }, // Game hasn't ended yet
      },
      select: { id: true, title: true, onchainId: true },
    });

    if (existingActiveGame) {
      return {
        success: false,
        error: `Cannot create a new game while "${existingActiveGame.title} ID: ${existingActiveGame.onchainId}" is still active. Please end it first.`,
      };
    }

    // Also check if there's a recently ended game that hasn't been ended on-chain yet
    const recentEndedGame = await prisma.game.findFirst({
      where: {
        endsAt: { lte: now },
        onchainId: { not: null },
      },
      orderBy: { endsAt: "desc" },
      select: { id: true, title: true, onchainId: true },
    });

    if (recentEndedGame?.onchainId) {
      const onChainGame = await getOnChainGame(
        recentEndedGame.onchainId as `0x${string}`
      );

      // Only block if game actually exists on-chain (has tickets or entry fee)
      // After contract upgrades, old onchainIds may not exist on new contract
      const gameExistsOnChain =
        onChainGame &&
        (onChainGame.ticketCount > BigInt(0) ||
          onChainGame.entryFee > BigInt(0));

      if (gameExistsOnChain && !onChainGame.ended) {
        return {
          success: false,
          error: `Cannot create a new game while "${recentEndedGame.title} ID: ${recentEndedGame.onchainId}" is not ended on-chain. Please end it on-chain first via Settlement.`,
        };
      }
    }

    // Generate random bytes32 for on-chain game ID
    const onchainId = generateOnchainGameId();

    // Create game in database (no status field, uses time-based phase)
    const game = await prisma.game.create({
      data: {
        title: data.title,
        description: data.description || null,
        theme: data.theme,
        coverUrl: data.coverUrl || "",
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        tierPrices: [data.tierPrice1, data.tierPrice2, data.tierPrice3],
        prizePool: 0, // Start at 0, incremented when entries are created
        playerCount: 0,
        roundBreakSec: data.roundBreakSec,
        maxPlayers: data.maxPlayers,
        onchainId, // Store the bytes32 on-chain ID
      },
    });

    // Create game onchain using the generated onchainId
    try {
      const txHash = await createGameOnChain(onchainId, data.tierPrice1);
      console.log(
        `[CreateGame] Game ${game.id} (onchain: ${onchainId}) created. TX: ${txHash}`
      );

      await logAdminAction({
        adminId: authResult.session.userId,
        action: AdminAction.CREATE_GAME,
        entityType: EntityType.GAME,
        entityId: game.id,
        details: {
          title: game.title,
          theme: game.theme,
          onChainTx: txHash,
          tierPrices: [data.tierPrice1, data.tierPrice2, data.tierPrice3],
        },
      });
    } catch (onChainError) {
      console.error(
        `[CreateGame] On-chain creation failed for game ${game.id}:`,
        onChainError
      );

      await logAdminAction({
        adminId: authResult.session.userId,
        action: AdminAction.CREATE_GAME,
        entityType: EntityType.GAME,
        entityId: game.id,
        details: {
          title: game.title,
          theme: game.theme,
          onChainError:
            onChainError instanceof Error
              ? onChainError.message
              : "Unknown error",
        },
      });
    }

    // Initialize PartyKit room with alarms
    if (env.partykitHost && env.partykitSecret) {
      const partykitUrl = env.partykitHost.startsWith("http")
        ? env.partykitHost
        : `https://${env.partykitHost}`;

      try {
        const res = await fetch(
          `${partykitUrl}/parties/game/game-${game.id}/init`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.partykitSecret}`,
            },
            body: JSON.stringify({
              gameId: game.id,
              startsAt: game.startsAt.toISOString(),
              endsAt: game.endsAt.toISOString(),
              questions: [], // Questions synced separately when added
            }),
          }
        );

        if (res.ok) {
          console.log(
            `[CreateGame] PartyKit room initialized for game ${game.id}`
          );
        } else {
          console.error(`[CreateGame] PartyKit init failed: ${res.status}`);
        }
      } catch (err) {
        console.error(`[CreateGame] PartyKit init error:`, err);
      }
    }

    revalidatePath("/admin/games");
    redirect(`/admin/games/${game.id}/questions`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Create game error:", error);
    return { success: false, error: "Failed to create game" };
  }
}

// ==========================================
// UPDATE GAME
// ==========================================

export async function updateGameAction(
  gameId: number,
  _prevState: GameActionResult | null,
  formData: FormData
): Promise<GameActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    theme: formData.get("theme"),
    coverUrl: formData.get("coverUrl"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    tierPrice1: formData.get("tierPrice1"),
    tierPrice2: formData.get("tierPrice2"),
    tierPrice3: formData.get("tierPrice3"),
    roundBreakSec: formData.get("roundBreakSec"),
    maxPlayers: formData.get("maxPlayers"),
  };

  const validation = gameSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid input",
    };
  }

  const data = validation.data;

  try {
    const game = await prisma.game.update({
      where: { id: gameId },
      data: {
        title: data.title,
        description: data.description || null,
        theme: data.theme,
        coverUrl: data.coverUrl || "",
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        tierPrices: [data.tierPrice1, data.tierPrice2, data.tierPrice3],
        roundBreakSec: data.roundBreakSec,
        maxPlayers: data.maxPlayers,
      },
    });

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.UPDATE_GAME,
      entityType: EntityType.GAME,
      entityId: game.id,
      details: { title: game.title },
    });

    revalidatePath("/admin/games");
    revalidatePath(`/admin/games/${game.id}`);

    return { success: true, gameId: game.id };
  } catch (error) {
    console.error("Update game error:", error);
    return { success: false, error: "Failed to update game" };
  }
}

// ==========================================
// DELETE GAME
// ==========================================

export async function deleteGameAction(gameId: number): Promise<void> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    redirect("/admin/login");
  }

  try {
    // Get the game to check if it has an onchain ID
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, onchainId: true, title: true },
    });

    if (!game) {
      throw new Error("Game not found");
    }

    // If game is on-chain, check if it's still active
    if (game.onchainId) {
      const { getOnChainGame } = await import("@/lib/chain");
      const onChainGame = await getOnChainGame(game.onchainId as `0x${string}`);

      // Only block if game actually exists on-chain (has tickets or entry fee)
      // After contract upgrades, old onchainIds may not exist on new contract
      const gameExistsOnChain =
        onChainGame &&
        (onChainGame.ticketCount > BigInt(0) ||
          onChainGame.entryFee > BigInt(0));

      if (gameExistsOnChain && !onChainGame.ended) {
        throw new Error(
          `Cannot delete "${game.title}" - it is still active on-chain. End it on-chain first via Settlement.`
        );
      }
    }

    await prisma.game.delete({
      where: { id: gameId },
    });

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.DELETE_GAME,
      entityType: EntityType.GAME,
      entityId: gameId,
    });
  } catch (error) {
    console.error("Delete game error:", error);
    throw error; // Re-throw so UI can handle it
  }

  revalidatePath("/admin/games");
  redirect("/admin/games");
}

// ==========================================
// CHANGE GAME TIMING (replaces status actions)
// ==========================================

/**
 * Force start a game by setting startsAt to now.
 */
export async function forceStartGameAction(
  gameId: number
): Promise<GameActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        startsAt: true,
        endsAt: true,
        title: true,
        _count: { select: { questions: true } },
      },
    });

    if (!game) {
      return { success: false, error: "Game not found" };
    }

    const phase = getGamePhase(game);
    if (phase === "LIVE") {
      return { success: false, error: "Game is already live" };
    }
    if (phase === "ENDED") {
      return { success: false, error: "Cannot start ended game" };
    }
    if (game._count.questions === 0) {
      return { success: false, error: "Cannot start game without questions" };
    }

    // Set startsAt to now
    await prisma.game.update({
      where: { id: gameId },
      data: { startsAt: new Date() },
    });

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.UPDATE_GAME,
      entityType: EntityType.GAME,
      entityId: gameId,
      details: { action: "FORCE_START", title: game.title },
    });

    revalidatePath("/admin/games");
    revalidatePath(`/admin/games/${gameId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to start game:", error);
    return { success: false, error: "Failed to start game" };
  }
}

/**
 * Force end a game by setting endsAt to now and calculating ranks.
 */
export async function forceEndGameAction(
  gameId: number
): Promise<GameActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { startsAt: true, endsAt: true, title: true },
    });

    if (!game) {
      return { success: false, error: "Game not found" };
    }

    const phase = getGamePhase(game);
    if (phase === "ENDED") {
      return { success: false, error: "Game has already ended" };
    }

    // Set endsAt to now
    await prisma.game.update({
      where: { id: gameId },
      data: { endsAt: new Date() },
    });

    // Calculate ranks for all entries
    const entries = await prisma.gameEntry.findMany({
      where: { gameId, paidAt: { not: null } },
      orderBy: [
        { score: "desc" },
        { createdAt: "asc" }, // Tie-breaker: earlier entry wins
      ],
      select: { id: true },
    });

    // Update ranks in transaction
    await prisma.$transaction(
      entries.map((entry, index) =>
        prisma.gameEntry.update({
          where: { id: entry.id },
          data: { rank: index + 1 },
        })
      )
    );

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.UPDATE_GAME,
      entityType: EntityType.GAME,
      entityId: gameId,
      details: {
        action: "FORCE_END",
        title: game.title,
        playerCount: entries.length,
      },
    });

    revalidatePath("/admin/games");
    revalidatePath(`/admin/games/${gameId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to end game:", error);
    return { success: false, error: "Failed to end game" };
  }
}

// Keep old function names as aliases for backwards compatibility
export const startGameAction = forceStartGameAction;
export const endGameAction = forceEndGameAction;

// Removed changeGameStatusAction - no longer needed with time-based phases
