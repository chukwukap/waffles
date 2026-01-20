"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction, AdminAction, EntityType } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createGameOnChain, generateOnchainGameId } from "@/lib/chain";
import { GameTheme } from "@prisma";

const SERVICE = "admin-games";

// ==========================================
// SCHEMA
// ==========================================

const gameSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  theme: z.enum(GameTheme),
  coverUrl: z.string().min(1, "Cover URL is required"),
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

  // 1. VALIDATE INPUT
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
  let gameId: string | null = null;

  try {
    // 2. DATABASE FIRST (easily reversible)
    const game = await prisma.game.create({
      data: {
        title: data.title,
        description: data.description || null,
        theme: data.theme,
        coverUrl: data.coverUrl,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        tierPrices: [data.tierPrice1, data.tierPrice2, data.tierPrice3],
        prizePool: 0,
        playerCount: 0,
        roundBreakSec: data.roundBreakSec,
        maxPlayers: data.maxPlayers,
        onchainId,
      },
    });
    gameId = game.id;

    // 3. PARTYKIT INIT (reversible - throws on failure)
    const { initGameRoom } = await import("@/lib/partykit");
    await initGameRoom(game.id, game.startsAt, game.endsAt);

    // 4. ON-CHAIN LAST (irreversible - only when everything else succeeded)
    const txHash = await createGameOnChain(onchainId, data.tierPrice1);

    console.log("[" + SERVICE + "]", "game_created", {
      gameId: game.id,
      title: game.title,
      theme: data.theme,
      onchainId,
      txHash,
    });

    // 5. LOG AND CLEANUP
    await logAdminAction({
      adminId,
      action: AdminAction.CREATE_GAME,
      entityType: EntityType.GAME,
      entityId: game.id,
      details: { title: game.title, theme: data.theme, onchainId, txHash },
    });

    revalidatePath("/admin/games");
  } catch (error) {
    // ROLLBACK: Delete DB record if we created one
    if (gameId) {
      await prisma.game.delete({ where: { id: gameId } }).catch((e) => {
        console.error("[" + SERVICE + "]", "rollback_failed", {
          gameId,
          error: e instanceof Error ? e.message : String(e),
        });
      });
    }
    // Note: On-chain cannot be rolled back, but we do on-chain LAST so this shouldn't happen

    console.error("[" + SERVICE + "]", "game_create_failed", {
      error: error instanceof Error ? error.message : String(error),
      gameId,
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

  // 1. VALIDATE INPUT
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
    // 2. UPDATE DATABASE
    const game = await prisma.game.update({
      where: { id: gameId },
      data: {
        title: data.title,
        description: data.description || null,
        theme: data.theme,
        coverUrl: data.coverUrl,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        tierPrices: [data.tierPrice1, data.tierPrice2, data.tierPrice3],
        roundBreakSec: data.roundBreakSec,
        maxPlayers: data.maxPlayers,
      },
    });

    // 3. SYNC TO PARTYKIT (throws on failure)
    const { updateGame } = await import("@/lib/partykit");
    await updateGame(game.id, game.startsAt, game.endsAt);

    // 4. LOG AND REVALIDATE
    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.UPDATE_GAME,
      entityType: EntityType.GAME,
      entityId: game.id,
      details: { title: game.title },
    });

    revalidatePath("/admin/games");
    revalidatePath(`/admin/games/${game.id}`);

    console.log("[admin-games] game_updated", {
      gameId: game.id,
      title: game.title,
    });

    return { success: true, gameId: game.id };
  } catch (error) {
    console.error("[admin-games] game_update_failed", {
      gameId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update game",
    };
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
    console.log("[" + SERVICE + "]", "game_delete_partykit_cleanup", {
      gameId,
      title: game.title,
    });
    const { cleanupGameRoom } = await import("@/lib/partykit");
    await cleanupGameRoom(gameId);

    // Delete game and cascade to entries, questions, etc.
    console.log("[" + SERVICE + "]", "game_delete_db_cascade", {
      gameId,
      entriesCount: game._count.entries,
    });
    await prisma.game.delete({
      where: { id: gameId },
    });

    console.log("[" + SERVICE + "]", "game_deleted", {
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
