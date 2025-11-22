"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction, AdminAction, EntityType } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const BulkQuestionSchema = z.object({
  content: z.string().min(5, "Question content is required"),
  options: z
    .array(z.string().min(1))
    .min(2, "At least 2 options required")
    .max(6, "Max 6 options allowed"),
  correctIndex: z.number().min(0, "Correct index must be valid"),
  durationSec: z.number().min(5).default(10),
  mediaUrl: z.string().optional(),
  soundUrl: z.string().optional(),
});

export interface BulkImportQuestion {
  content: string;
  options: string[];
  correctIndex: number;
  durationSec: number;
  mediaUrl?: string;
  soundUrl?: string;
}

export type BulkImportResult =
  | { success: true; imported: number; skipped: number }
  | { success: false; error: string };

/**
 * Import multiple questions at once
 */
export async function bulkImportQuestionsAction(
  gameId: number,
  questions: BulkImportQuestion[]
): Promise<BulkImportResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { questions: true },
    });

    if (!game) {
      return { success: false, error: "Game not found" };
    }

    let imported = 0;
    let skipped = 0;
    let currentRoundIndex = game.questions.length + 1;

    // Import questions one by one
    for (const questionData of questions) {
      try {
        // Validate
        const validated = BulkQuestionSchema.parse(questionData);

        // Create question
        await prisma.question.create({
          data: {
            gameId,
            roundIndex: currentRoundIndex,
            content: validated.content,
            options: validated.options,
            correctIndex: validated.correctIndex,
            mediaUrl: validated.mediaUrl || null,
            soundUrl: validated.soundUrl || null,
            durationSec: validated.durationSec,
          },
        });

        imported++;
        currentRoundIndex++;
      } catch (error) {
        console.error("Failed to import question:", error);
        skipped++;
      }
    }

    // Log bulk import
    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.CREATE_QUESTION,
      entityType: EntityType.GAME,
      entityId: gameId,
      details: { bulkImport: true, imported, skipped },
    });

    revalidatePath(`/admin/games/${gameId}/questions`);

    return { success: true, imported, skipped };
  } catch (error) {
    console.error("Bulk import error:", error);
    return { success: false, error: "Failed to import questions" };
  }
}
