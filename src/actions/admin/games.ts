"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction, AdminAction, EntityType } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const gameSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  theme: z.enum(["FOOTBALL", "MOVIES", "ANIME", "POLITICS", "CRYPTO"]),
  coverUrl: z.string().optional().nullable(),
  startsAt: z.string().transform((str) => new Date(str)),
  endsAt: z.string().transform((str) => new Date(str)),
  entryFee: z.coerce.number().min(0, "Entry fee must be non-negative"),
  prizePool: z.coerce.number().min(0, "Prize pool must be non-negative"),
  roundDurationSec: z.coerce
    .number()
    .min(5, "Duration must be at least 5 seconds"),
  maxPlayers: z.coerce.number().min(2, "Must allow at least 2 players"),
});

export type GameActionResult =
  | { success: true; gameId?: number }
  | { success: false; error: string };

/**
 * Create a new game
 */
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
    entryFee: formData.get("entryFee"),
    prizePool: formData.get("prizePool"),
    roundDurationSec: formData.get("roundDurationSec"),
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
    const game = await prisma.game.create({
      data: {
        title: data.title,
        description: data.description || null,
        theme: data.theme,
        coverUrl: data.coverUrl || null,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        entryFee: data.entryFee,
        prizePool: data.prizePool,
        roundDurationSec: data.roundDurationSec,
        maxPlayers: data.maxPlayers,
        status: "SCHEDULED",
      },
    });

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.CREATE_GAME,
      entityType: EntityType.GAME,
      entityId: game.id,
      details: { title: game.title, theme: game.theme },
    });

    revalidatePath("/admin/games");
    redirect(`/admin/games/${game.id}/questions`);
  } catch (error) {
    // Re-throw Next.js redirects (they're not actual errors)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Create game error:", error);
    return { success: false, error: "Failed to create game" };
  }
}

/**
 * Update an existing game
 */
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
    entryFee: formData.get("entryFee"),
    prizePool: formData.get("prizePool"),
    roundDurationSec: formData.get("roundDurationSec"),
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
        coverUrl: data.coverUrl || null,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        entryFee: data.entryFee,
        prizePool: data.prizePool,
        roundDurationSec: data.roundDurationSec,
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

/**
 * Delete a game (form action - returns void)
 */
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

/**
 * Change game status
 */
export async function changeGameStatusAction(
  gameId: number,
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED"
): Promise<GameActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.game.update({
      where: { id: gameId },
      data: { status },
    });

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.CHANGE_GAME_STATUS,
      entityType: EntityType.GAME,
      entityId: gameId,
      details: { newStatus: status },
    });

    revalidatePath("/admin/games");
    revalidatePath(`/admin/games/${gameId}`);

    return { success: true };
  } catch (error) {
    console.error("Change game status error:", error);
    return { success: false, error: "Failed to change game status" };
  }
}

/**
 * Start a game (change status to LIVE)
 */
export async function startGameAction(
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
        status: true,
        title: true,
        _count: { select: { questions: true } },
      },
    });

    if (!game) {
      return { success: false, error: "Game not found" };
    }

    if (game.status === "LIVE") {
      return { success: false, error: "Game is already live" };
    }

    if (game.status === "ENDED" || game.status === "CANCELLED") {
      return {
        success: false,
        error: `Cannot start ${game.status.toLowerCase()} game`,
      };
    }

    if (game._count.questions === 0) {
      return { success: false, error: "Cannot start game without questions" };
    }

    await prisma.game.update({
      where: { id: gameId },
      data: { status: "LIVE" },
    });

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.UPDATE_GAME, // Changed from AdminAction.UPDATE
      entityType: EntityType.GAME,
      entityId: gameId, // Changed from gameId.toString()
      details: { status: "LIVE", title: game.title }, // Changed from metadata
    });

    revalidatePath("/admin/games");
    revalidatePath(`/admin/games/${gameId}`); // Added revalidate for specific game page
    return { success: true };
  } catch (error) {
    console.error("Failed to start game:", error);
    return { success: false, error: "Failed to start game" };
  }
}

/**
 * End a game (change status to ENDED)
 */
export async function endGameAction(gameId: number): Promise<GameActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { status: true, title: true },
    });

    if (!game) {
      return { success: false, error: "Game not found" };
    }

    if (game.status === "ENDED") {
      return { success: false, error: "Game has already ended" };
    }

    if (game.status === "CANCELLED") {
      return { success: false, error: "Cannot end cancelled game" };
    }

    // 1. Update Game Status
    await prisma.game.update({
      where: { id: gameId },
      data: { status: "ENDED" },
    });

    // 2. Calculate Ranks
    // Fetch all players sorted by score (desc) and joinedAt (asc)
    const players = await prisma.gamePlayer.findMany({
      where: { gameId },
      orderBy: [
        { score: "desc" },
        { joinedAt: "asc" }, // Tie-breaker: earlier joiner wins
      ],
      select: { id: true },
    });

    // 3. Persist Ranks
    // We use a transaction to ensure all ranks are updated atomically
    await prisma.$transaction(
      players.map((player, index) =>
        prisma.gamePlayer.update({
          where: { id: player.id },
          data: { rank: index + 1 },
        })
      )
    );

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.UPDATE_GAME, // Changed from AdminAction.UPDATE
      entityType: EntityType.GAME,
      entityId: gameId, // Changed from gameId.toString()
      details: {
        status: "ENDED",
        title: game.title,
        playerCount: players.length,
      }, // Changed from metadata
    });

    revalidatePath("/admin/games");
    revalidatePath(`/admin/games/${gameId}`); // Added revalidate for specific game page
    return { success: true };
  } catch (error) {
    console.error("Failed to end game:", error);
    return { success: false, error: "Failed to end game" };
  }
}
