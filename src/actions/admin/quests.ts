"use server";

import { prisma, QuestType, QuestCategory, RepeatFrequency } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { sendBulkNotifications } from "@/lib/notifications";
import { logAdminAction, EntityType } from "@/lib/audit";
import { env } from "@/lib/env";

// ============================================
// SCHEMAS
// ============================================

const createQuestSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  iconUrl: z.string().url().nullable().optional(),
  category: z.nativeEnum(QuestCategory),
  sortOrder: z.number().int().default(0),
  points: z.number().int().min(0),
  type: z.nativeEnum(QuestType),
  actionUrl: z.string().url().nullable().optional(),
  castHash: z.string().nullable().optional(),
  targetFid: z.number().int().nullable().optional(),
  requiredCount: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  startsAt: z.date().nullable().optional(),
  endsAt: z.date().nullable().optional(),
  repeatFrequency: z.nativeEnum(RepeatFrequency).default("ONCE"),
});

const updateQuestSchema = createQuestSchema.partial().extend({
  id: z.number().int(),
});

// ============================================
// TYPES
// ============================================

export type CreateQuestInput = z.infer<typeof createQuestSchema>;
export type UpdateQuestInput = z.infer<typeof updateQuestSchema>;

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ============================================
// ACTIONS
// ============================================

/**
 * Create a new quest
 */
export async function createQuestAction(
  input: CreateQuestInput
): Promise<ActionResult<{ id: number }>> {
  const auth = await requireAdminSession();
  if (!auth.authenticated || !auth.session) {
    return { success: false, error: "Unauthorized" };
  }

  const validation = createQuestSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    const quest = await prisma.quest.create({
      data: {
        slug: validation.data.slug,
        title: validation.data.title,
        description: validation.data.description,
        iconUrl: validation.data.iconUrl ?? null,
        category: validation.data.category,
        sortOrder: validation.data.sortOrder ?? 0,
        points: validation.data.points,
        type: validation.data.type,
        actionUrl: validation.data.actionUrl ?? null,
        castHash: validation.data.castHash ?? null,
        targetFid: validation.data.targetFid ?? null,
        requiredCount: validation.data.requiredCount ?? 1,
        isActive: validation.data.isActive ?? true,
        startsAt: validation.data.startsAt ?? null,
        endsAt: validation.data.endsAt ?? null,
        repeatFrequency: validation.data.repeatFrequency ?? "ONCE",
      },
    });

    // Send notifications to waitlist users if quest is active
    if (quest.isActive) {
      try {
        const notificationResults = await sendBulkNotifications({
          title: "🎯 New Quest Available!",
          body: `Complete "${quest.title}" to earn ${quest.points} points!`,
          targetUrl: `${env.rootUrl}/waitlist/quests`,
          filter: "waitlist",
        });

        // Log the notification action for audit trail
        await logAdminAction({
          adminId: auth.session.userId,
          action: "SEND_QUEST_NOTIFICATION",
          entityType: EntityType.SYSTEM,
          entityId: quest.id,
          details: {
            questTitle: quest.title,
            questPoints: quest.points,
            notificationResults,
          },
        });

        console.log(
          `[QuestNotification] Sent notifications for quest "${quest.title}":`,
          notificationResults
        );
      } catch (notificationError) {
        // Log but don't fail the quest creation
        console.error(
          "[QuestNotification] Failed to send notifications:",
          notificationError
        );
      }
    }

    revalidatePath("/admin/quests");
    return { success: true, data: { id: quest.id } };
  } catch (error) {
    console.error("Error creating quest:", error);
    return { success: false, error: "Failed to create quest" };
  }
}

/**
 * Update an existing quest
 */
export async function updateQuestAction(
  input: UpdateQuestInput
): Promise<ActionResult> {
  const auth = await requireAdminSession();
  if (!auth.authenticated || !auth.session) {
    return { success: false, error: "Unauthorized" };
  }

  const validation = updateQuestSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { id, ...data } = validation.data;

  try {
    await prisma.quest.update({
      where: { id },
      data: {
        ...(data.slug && { slug: data.slug }),
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.iconUrl !== undefined && { iconUrl: data.iconUrl }),
        ...(data.category && { category: data.category }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.points !== undefined && { points: data.points }),
        ...(data.type && { type: data.type }),
        ...(data.actionUrl !== undefined && { actionUrl: data.actionUrl }),
        ...(data.castHash !== undefined && { castHash: data.castHash }),
        ...(data.targetFid !== undefined && { targetFid: data.targetFid }),
        ...(data.requiredCount !== undefined && {
          requiredCount: data.requiredCount,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.startsAt !== undefined && { startsAt: data.startsAt }),
        ...(data.endsAt !== undefined && { endsAt: data.endsAt }),
        ...(data.repeatFrequency && { repeatFrequency: data.repeatFrequency }),
      },
    });

    revalidatePath("/admin/quests");
    revalidatePath("/waitlist/quests");
    return { success: true };
  } catch (error) {
    console.error("Error updating quest:", error);
    return { success: false, error: "Failed to update quest" };
  }
}

/**
 * Delete a quest
 */
export async function deleteQuestAction(id: number): Promise<ActionResult> {
  const auth = await requireAdminSession();
  if (!auth.authenticated || !auth.session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.quest.delete({
      where: { id },
    });

    revalidatePath("/admin/quests");
    return { success: true };
  } catch (error) {
    console.error("Error deleting quest:", error);
    return { success: false, error: "Failed to delete quest" };
  }
}

/**
 * Toggle quest active status
 */
export async function toggleQuestActiveAction(
  id: number,
  isActive: boolean
): Promise<ActionResult> {
  const auth = await requireAdminSession();
  if (!auth.authenticated || !auth.session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.quest.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/admin/quests");
    revalidatePath("/waitlist/quests");
    return { success: true };
  } catch (error) {
    console.error("Error toggling quest:", error);
    return { success: false, error: "Failed to toggle quest" };
  }
}

/**
 * Approve a pending custom quest completion
 */
export async function approveQuestCompletionAction(
  completedQuestId: number
): Promise<ActionResult> {
  const auth = await requireAdminSession();
  if (!auth.authenticated || !auth.session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const completedQuest = await prisma.completedQuest.findUnique({
      where: { id: completedQuestId },
      include: { quest: true, user: true },
    });

    if (!completedQuest) {
      return { success: false, error: "Completion not found" };
    }

    if (completedQuest.isApproved) {
      return { success: false, error: "Already approved" };
    }

    // Approve and award points
    await prisma.$transaction([
      prisma.completedQuest.update({
        where: { id: completedQuestId },
        data: {
          isApproved: true,
          approvedBy: auth.session.userId,
          approvedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: completedQuest.userId },
        data: {
          waitlistPoints: {
            increment: completedQuest.quest.points,
          },
        },
      }),
    ]);

    revalidatePath("/admin/quests");
    revalidatePath("/waitlist/quests");
    return { success: true };
  } catch (error) {
    console.error("Error approving quest completion:", error);
    return { success: false, error: "Failed to approve" };
  }
}

/**
 * Reject a pending custom quest completion
 */
export async function rejectQuestCompletionAction(
  completedQuestId: number
): Promise<ActionResult> {
  const auth = await requireAdminSession();
  if (!auth.authenticated || !auth.session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.completedQuest.delete({
      where: { id: completedQuestId },
    });

    revalidatePath("/admin/quests");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting quest completion:", error);
    return { success: false, error: "Failed to reject" };
  }
}
