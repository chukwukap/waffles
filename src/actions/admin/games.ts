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
// SCHEMA
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
// HELPER: Rollback game on failure
// ==========================================

async function rollbackGame(
  gameId: number,
  reason: string,
  adminId: number
): Promise<void> {
  console.error(`[CreateGame] Rolling back game ${gameId}: ${reason}`);

  try {
    await prisma.game.delete({ where: { id: gameId } });
    console.log(`[CreateGame] Rollback complete for game ${gameId}`);

    await logAdminAction({
      adminId,
      action: AdminAction.DELETE_GAME,
      entityType: EntityType.GAME,
      entityId: gameId,
      details: { reason: `Rollback: ${reason}` },
    });
  } catch (error) {
    console.error(`[CreateGame] Rollback failed for game ${gameId}:`, error);
    // If rollback fails, we have an orphaned game - log for manual cleanup
    await logAdminAction({
      adminId,
      action: AdminAction.DELETE_GAME,
      entityType: EntityType.GAME,
      entityId: gameId,
      details: {
        reason: `ROLLBACK_FAILED: ${reason}`,
        requiresManualCleanup: true,
      },
    });
  }
}

// ==========================================
// HELPER: Initialize PartyKit room
// ==========================================

async function initializePartyKitRoom(game: {
  id: number;
  startsAt: Date;
  endsAt: Date;
}): Promise<{ success: boolean; error?: string }> {
  if (!env.partykitHost || !env.partykitSecret) {
    return { success: false, error: "PartyKit not configured" };
  }

  const partykitUrl = env.partykitHost.startsWith("http")
    ? env.partykitHost
    : `https://${env.partykitHost}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
          questions: [],
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        success: false,
        error: `PartyKit returned ${res.status}: ${res.statusText}`,
      };
    }

    console.log(`[CreateGame] PartyKit room initialized for game ${game.id}`);
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, error: "PartyKit request timed out" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ==========================================
// CREATE GAME - Rock Solid Flow
// ==========================================

export async function createGameAction(
  _prevState: GameActionResult | null,
  formData: FormData
): Promise<GameActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  const adminId = authResult.session.userId;

  // 1. Validate form data
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

  // 2. Pre-flight checks (before any mutations)
  try {
    const now = new Date();

    // Check no active games
    const existingActiveGame = await prisma.game.findFirst({
      where: { endsAt: { gt: now } },
      select: { id: true, title: true, onchainId: true },
    });

    if (existingActiveGame) {
      return {
        success: false,
        error: `Cannot create game while "${existingActiveGame.title}" is still active.`,
      };
    }

    // Check recently ended game is finalized on-chain
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

      const gameExistsOnChain =
        onChainGame &&
        (onChainGame.ticketCount > BigInt(0) ||
          onChainGame.entryFee > BigInt(0));

      if (gameExistsOnChain && !onChainGame.ended) {
        return {
          success: false,
          error: `Previous game "${recentEndedGame.title}" not ended on-chain. End it first via Settlement.`,
        };
      }
    }
  } catch (error) {
    console.error("[CreateGame] Pre-flight check failed:", error);
    return {
      success: false,
      error: "Failed to verify game prerequisites. Please try again.",
    };
  }

  // 3. Generate on-chain ID upfront
  const onchainId = generateOnchainGameId();

  // 4. Create game in database
  let game: { id: number; startsAt: Date; endsAt: Date; title: string };

  try {
    game = await prisma.game.create({
      data: {
        title: data.title,
        description: data.description || null,
        theme: data.theme,
        coverUrl: data.coverUrl || "",
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        tierPrices: [data.tierPrice1, data.tierPrice2, data.tierPrice3],
        prizePool: 0,
        playerCount: 0,
        roundBreakSec: data.roundBreakSec,
        maxPlayers: data.maxPlayers,
        onchainId,
      },
    });
    console.log(`[CreateGame] Database record created: game ${game.id}`);
  } catch (error) {
    console.error("[CreateGame] Database creation failed:", error);
    return {
      success: false,
      error: "Failed to create game in database. Please try again.",
    };
  }

  // 5. Create on-chain (with rollback on failure)
  try {
    const txHash = await createGameOnChain(onchainId, data.tierPrice1);
    console.log(`[CreateGame] On-chain creation success. TX: ${txHash}`);

    await logAdminAction({
      adminId,
      action: AdminAction.CREATE_GAME,
      entityType: EntityType.GAME,
      entityId: game.id,
      details: {
        title: game.title,
        theme: data.theme,
        onchainId,
        onChainTx: txHash,
        tierPrices: [data.tierPrice1, data.tierPrice2, data.tierPrice3],
      },
    });
  } catch (error) {
    console.error("[CreateGame] On-chain creation failed:", error);
    await rollbackGame(game.id, "On-chain creation failed", adminId);

    const errorMsg =
      error instanceof Error ? error.message : "Unknown blockchain error";
    return {
      success: false,
      error: `On-chain creation failed: ${errorMsg}. Game was not created.`,
    };
  }

  // 6. Initialize PartyKit room (with rollback on failure)
  const partykitResult = await initializePartyKitRoom(game);

  if (!partykitResult.success) {
    console.error("[CreateGame] PartyKit init failed:", partykitResult.error);
    await rollbackGame(game.id, "PartyKit initialization failed", adminId);

    return {
      success: false,
      error: `Game server initialization failed: ${partykitResult.error}. Game was not created.`,
    };
  }

  // 7. All systems go - redirect to questions page
  console.log(`[CreateGame] Game ${game.id} created successfully`);

  revalidatePath("/admin/games");
  redirect(`/admin/games/${game.id}/questions`);
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

      const gameExistsOnChain =
        onChainGame &&
        (onChainGame.ticketCount > BigInt(0) ||
          onChainGame.entryFee > BigInt(0));

      if (gameExistsOnChain && !onChainGame.ended) {
        throw new Error(
          `Cannot delete "${game.title}" - it is still active on-chain. End it first via Settlement.`
        );
      }
    }

    // Cleanup PartyKit room before deleting
    const { cleanupGameRoom } = await import("@/lib/partykit");
    await cleanupGameRoom(gameId);

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
    throw error;
  }

  revalidatePath("/admin/games");
  redirect("/admin/games");
}

// ==========================================
// CHANGE GAME TIMING
// ==========================================

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

    await prisma.game.update({
      where: { id: gameId },
      data: { endsAt: new Date() },
    });

    // Calculate ranks for all entries
    const entries = await prisma.gameEntry.findMany({
      where: { gameId, paidAt: { not: null } },
      orderBy: [{ score: "desc" }, { createdAt: "asc" }],
      select: { id: true },
    });

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
