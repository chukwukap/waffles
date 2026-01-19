"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction, AdminAction, EntityType } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createGameOnChain, generateOnchainGameId } from "@/lib/chain";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const SERVICE = "admin-games";

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
  // NOTE: startsAt and endsAt should be ISO 8601 strings (with timezone/UTC).
  // The client converts datetime-local values to ISO format before submission
  // to ensure consistent timezone handling between local and production servers.
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
  | { success: true; gameId?: string }
  | { success: false; error: string };

// ==========================================
// CREATE GAME
// ==========================================

export async function createGameAction(
  _prevState: GameActionResult | null,
  formData: FormData,
): Promise<GameActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  const adminId = authResult.session.userId;

  // Validate form data
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
  const onchainId = generateOnchainGameId();
  let gameId: string;

  try {
    // 1. Create on-chain first (so we don't have orphaned DB records)
    const txHash = await createGameOnChain(onchainId, data.tierPrice1);
    console.log(`[CreateGame] On-chain created. TX: ${txHash}`);

    // 2. Create in database
    const game = await prisma.game.create({
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

    gameId = game.id;

    // 3. Initialize PartyKit room (BLOCKING - must succeed for game to be valid)
    if (env.partykitHost && env.partykitSecret) {
      const partykitUrl = env.partykitHost.startsWith("http")
        ? env.partykitHost
        : `https://${env.partykitHost}`;

      const initUrl = `${partykitUrl}/parties/main/game-${game.id}/init`;

      logger.info(SERVICE, "partykit_init_request", {
        gameId: game.id,
        url: initUrl,
        startsAt: game.startsAt.toISOString(),
        endsAt: game.endsAt.toISOString(),
      });

      const initRes = await fetch(initUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.partykitSecret}`,
        },
        body: JSON.stringify({
          gameId: game.id,
          startsAt: game.startsAt.toISOString(),
          endsAt: game.endsAt.toISOString(),
        }),
      });

      if (!initRes.ok) {
        const errorText = await initRes.text().catch(() => "Unknown error");
        logger.error(SERVICE, "partykit_init_failed", {
          gameId: game.id,
          status: initRes.status,
          error: errorText,
        });

        // Rollback: delete the game we just created
        await prisma.game.delete({ where: { id: game.id } });

        return {
          success: false,
          error: `Failed to initialize game server: ${errorText}`,
        };
      }

      logger.info(SERVICE, "partykit_init_success", {
        gameId: game.id,
        status: initRes.status,
      });
    } else {
      // In production, PartyKit is required
      logger.error(SERVICE, "partykit_not_configured", {
        gameId: game.id,
        hasHost: !!env.partykitHost,
        hasSecret: !!env.partykitSecret,
      });

      // Rollback
      await prisma.game.delete({ where: { id: game.id } });

      return {
        success: false,
        error: "Game server not configured. Contact administrator.",
      };
    }

    await logAdminAction({
      adminId,
      action: AdminAction.CREATE_GAME,
      entityType: EntityType.GAME,
      entityId: game.id,
      details: { title: game.title, theme: data.theme, onchainId, txHash },
    });

    logger.info(SERVICE, "game_created", {
      gameId: game.id,
      title: game.title,
      theme: data.theme,
      onchainId,
    });

    revalidatePath("/admin/games");
  } catch (error) {
    logger.error(SERVICE, "game_create_failed", {
      error: logger.errorMessage(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create game",
    };
  }

  // Redirect outside try/catch (Next.js redirect throws internally)
  redirect(`/admin/games/${gameId}/questions`);
}

// ==========================================
// UPDATE GAME
// ==========================================

export async function updateGameAction(
  gameId: string,
  _prevState: GameActionResult | null,
  formData: FormData,
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

    // Sync timing to PartyKit (async, don't block response)
    logger.info(SERVICE, "game_update_partykit_sync", {
      gameId: game.id,
      startsAt: new Date(data.startsAt).toISOString(),
      endsAt: new Date(data.endsAt).toISOString(),
    });

    const { updateGameTiming } = await import("@/lib/partykit");
    updateGameTiming(
      game.id,
      new Date(data.startsAt),
      new Date(data.endsAt),
    ).catch((err) =>
      logger.error(SERVICE, "game_update_partykit_sync_error", {
        gameId: game.id,
        error: logger.errorMessage(err),
      }),
    );

    revalidatePath("/admin/games");
    revalidatePath(`/admin/games/${game.id}`);

    logger.info(SERVICE, "game_updated", {
      gameId: game.id,
      title: game.title,
    });

    return { success: true, gameId: game.id };
  } catch (error) {
    logger.error(SERVICE, "game_update_failed", {
      gameId,
      error: logger.errorMessage(error),
    });
    return { success: false, error: "Failed to update game" };
  }
}

// ==========================================
// DELETE GAME
// ==========================================

export async function deleteGameAction(gameId: string): Promise<void> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    redirect("/admin/login");
  }

  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        onchainId: true,
        title: true,
        _count: { select: { entries: true } },
      },
    });

    if (!game) {
      throw new Error("Game not found");
    }

    // If game is on-chain, force close sales first
    if (game.onchainId) {
      const { getOnChainGame, closeSalesOnChain } = await import("@/lib/chain");
      const onChainGame = await getOnChainGame(game.onchainId as `0x${string}`);

      const gameExistsOnChain =
        onChainGame &&
        (onChainGame.ticketCount > BigInt(0) ||
          onChainGame.minimumTicketPrice > BigInt(0));

      if (gameExistsOnChain && !onChainGame.salesClosed) {
        console.log(
          `[DeleteGame] Force closing sales for game ${game.onchainId} on-chain...`,
        );

        try {
          const txHash = await closeSalesOnChain(
            game.onchainId as `0x${string}`,
          );
          console.log(`[DeleteGame] Game sales closed on-chain. TX: ${txHash}`);
        } catch (endError) {
          console.error(
            `[DeleteGame] Failed to close sales on-chain:`,
            endError,
          );
          throw new Error(
            `Failed to close sales on-chain before deletion. Please try again or close sales manually first.`,
          );
        }
      }
    }

    // Cleanup PartyKit room
    logger.info(SERVICE, "game_delete_partykit_cleanup", {
      gameId,
      title: game.title,
    });
    const { cleanupGameRoom } = await import("@/lib/partykit");
    await cleanupGameRoom(gameId);

    // Delete game and cascade to entries, questions, etc.
    logger.info(SERVICE, "game_delete_db_cascade", {
      gameId,
      entriesCount: game._count.entries,
    });
    await prisma.game.delete({
      where: { id: gameId },
    });

    logger.info(SERVICE, "game_deleted", {
      gameId,
      title: game.title,
      entriesDeleted: game._count.entries,
    });

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.DELETE_GAME,
      entityType: EntityType.GAME,
      entityId: gameId,
      details: {
        title: game.title,
        onchainId: game.onchainId,
        entriesDeleted: game._count.entries,
      },
    });
  } catch (error) {
    console.error("Delete game error:", error);
    throw error;
  }

  revalidatePath("/admin/games");
  redirect("/admin/games");
}
