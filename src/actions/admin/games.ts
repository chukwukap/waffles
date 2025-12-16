"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction, AdminAction, EntityType } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createGameOnChain } from "@/lib/settlement";
import { getGamePhase } from "@/lib/game-utils";

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
  ticketPrice: z.coerce.number().min(0, "Ticket price must be non-negative"),
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
    ticketPrice: formData.get("entryFee") || formData.get("ticketPrice"), // Support both field names
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
    // Create game in database (no status field, uses time-based phase)
    const game = await prisma.game.create({
      data: {
        title: data.title,
        description: data.description || null,
        theme: data.theme,
        coverUrl: data.coverUrl || "",
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        ticketPrice: data.ticketPrice,
        prizePool: 0, // Start at 0, incremented when entries are created
        playerCount: 0,
        roundBreakSec: data.roundBreakSec,
        maxPlayers: data.maxPlayers,
      },
    });

    // Create game on-chain
    try {
      const txHash = await createGameOnChain(game.id, data.ticketPrice);
      console.log(
        `[CreateGame] Game ${game.id} created on-chain. TX: ${txHash}`
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
          ticketPrice: data.ticketPrice,
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
    ticketPrice: formData.get("entryFee") || formData.get("ticketPrice"),
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
        ticketPrice: data.ticketPrice,
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
