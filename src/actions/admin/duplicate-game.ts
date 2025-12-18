"use server";

import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction, AdminAction, EntityType } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type DuplicateGameResult =
  | { success: true; gameId: number }
  | { success: false; error: string };

/**
 * Duplicate a game with all its questions
 * Updated for new schema (tierPrices, orderInRound, no status)
 */
export async function duplicateGameAction(gameId: number): Promise<void> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    redirect("/admin/login");
  }

  try {
    // Get original game with questions
    const originalGame = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        questions: {
          orderBy: [{ roundIndex: "asc" }, { orderInRound: "asc" }],
        },
      },
    });

    if (!originalGame) {
      throw new Error("Game not found");
    }

    // Create new game with "Copy" suffix
    // No status field - uses time-based phase detection
    const newGame = await prisma.game.create({
      data: {
        title: `${originalGame.title} (Copy)`,
        description: originalGame.description,
        theme: originalGame.theme,
        coverUrl: originalGame.coverUrl,
        // Set dates to future (7 days from now)
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        tierPrices: originalGame.tierPrices,
        prizePool: 0, // New game starts with 0
        playerCount: 0,
        roundBreakSec: originalGame.roundBreakSec,
        maxPlayers: originalGame.maxPlayers,
      },
    });

    // Copy all questions
    if (originalGame.questions.length > 0) {
      await prisma.question.createMany({
        data: originalGame.questions.map((q) => ({
          gameId: newGame.id,
          roundIndex: q.roundIndex,
          orderInRound: q.orderInRound,
          content: q.content,
          options: q.options,
          correctIndex: q.correctIndex,
          mediaUrl: q.mediaUrl,
          soundUrl: q.soundUrl,
          durationSec: q.durationSec,
          points: q.points,
        })),
      });
    }

    // Log action
    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.CREATE_GAME,
      entityType: EntityType.GAME,
      entityId: newGame.id,
      details: {
        duplicatedFrom: originalGame.id,
        questionsCopied: originalGame.questions.length,
      },
    });

    revalidatePath("/admin/games");
    redirect(`/admin/games/${newGame.id}/questions`);
  } catch (error) {
    console.error("Duplicate game error:", error);
    throw error;
  }
}
