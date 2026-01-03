"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction, AdminAction, EntityType } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { syncQuestionsToPartyKit } from "@/lib/partykit";

const QuestionSchema = z.object({
  content: z.string().min(5, "Question content is required"),
  optionA: z.string().min(1, "Option A is required"),
  optionB: z.string().min(1, "Option B is required"),
  optionC: z.string().min(1, "Option C is required"),
  optionD: z.string().min(1, "Option D is required"),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  durationSec: z.coerce.number().min(5).default(10),
  roundIndex: z.coerce.number().min(1),
  mediaUrl: z.string().optional(),
  soundUrl: z.string().optional(),
});

export type QuestionActionResult =
  | { success: true; questionId?: number }
  | { success: false; error: string };

/**
 * Create a question for a game
 */
export async function createQuestionAction(
  gameId: string,
  _prevState: QuestionActionResult | null,
  formData: FormData
): Promise<QuestionActionResult> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  const rawData = {
    content: formData.get("content"),
    optionA: formData.get("optionA"),
    optionB: formData.get("optionB"),
    optionC: formData.get("optionC"),
    optionD: formData.get("optionD"),
    correctAnswer: formData.get("correctAnswer"),
    roundIndex: formData.get("roundIndex"),
    mediaUrl: formData.get("mediaUrl"),
    soundUrl: formData.get("soundUrl"),
    durationSec: formData.get("durationSec") || "10",
  };

  const validation = QuestionSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid input",
    };
  }

  const data = validation.data;

  // Convert correct answer letter to index (A=0, B=1, C=2, D=3)
  const correctIndex = data.correctAnswer.charCodeAt(0) - 65;

  try {
    const question = await prisma.question.create({
      data: {
        gameId,
        roundIndex: data.roundIndex,
        content: data.content,
        options: [data.optionA, data.optionB, data.optionC, data.optionD],
        correctIndex,
        mediaUrl: data.mediaUrl || "",
        soundUrl: data.soundUrl || "",
        durationSec: data.durationSec,
      },
    });

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.CREATE_QUESTION,
      entityType: EntityType.QUESTION,
      entityId: question.id,
      details: { gameId, roundIndex: data.roundIndex },
    });
    // Sync questions to PartyKit
    await syncQuestionsToPartyKit(gameId);
    revalidatePath(`/admin/games/${gameId}/questions`);

    return { success: true, questionId: question.id };
  } catch (error) {
    console.error("Create question error:", error);
    return { success: false, error: "Failed to create question" };
  }
}

/**
 * Delete a question (form action - returns void)
 */
export async function deleteQuestionAction(
  questionId: number,
  gameId: string
): Promise<void> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    redirect("/admin/login");
  }

  try {
    await prisma.question.delete({
      where: { id: questionId },
    });

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.DELETE_QUESTION,
      entityType: EntityType.QUESTION,
      entityId: questionId,
      details: { gameId },
    });
  } catch (error) {
    console.error("Delete question error:", error);
  }

  // Sync questions to PartyKit
  await syncQuestionsToPartyKit(gameId);

  revalidatePath(`/admin/games/${gameId}/questions`);
  redirect(`/admin/games/${gameId}/questions`);
}

/**
 * Reorder questions
 */
export async function reorderQuestionsAction(
  gameId: string,
  orderedQuestionIds: number[]
): Promise<{ success: boolean; error?: string }> {
  const authResult = await requireAdminSession();
  if (!authResult.authenticated || !authResult.session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Use a transaction to update all questions
    await prisma.$transaction(
      orderedQuestionIds.map((id, index) =>
        prisma.question.update({
          where: { id },
          data: { orderInRound: index },
        })
      )
    );

    await logAdminAction({
      adminId: authResult.session.userId,
      action: AdminAction.UPDATE_GAME, // Using UPDATE_GAME as a proxy for reordering
      entityType: EntityType.GAME,
      entityId: gameId,
      details: { action: "reorder_questions" },
    });

    // Sync questions to PartyKit
    await syncQuestionsToPartyKit(gameId);

    revalidatePath(`/admin/games/${gameId}/questions`);

    return { success: true };
  } catch (error) {
    console.error("Reorder questions error:", error);
    return { success: false, error: "Failed to reorder questions" };
  }
}
