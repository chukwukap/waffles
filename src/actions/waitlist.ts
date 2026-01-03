"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma";
import { verifyFarcasterFollow } from "@/lib/verifyFarcasterFollow";
import { verifyFarcasterMention } from "@/lib/verifyFarcasterMention";
import { REFERRAL_BONUS_POINTS } from "@/lib/constants";

export type JoinWaitlistState = {
  ok: boolean;
  already?: boolean;
  error?: string;
};

// ... (joinWaitlistSchema and joinWaitlistAction remain mostly unchanged, just imports) ...

// Schema to validate the incoming FormData
const joinWaitlistSchema = z.object({
  fid: z.coerce.number().int().positive("FID is required."),
  ref: z.coerce.number().int().positive().optional().nullable(),
});

/**
 * Adds a user to the waitlist by setting their joinedWaitlistAt timestamp.
 * If a referrer FID is provided, it links the referral via referredById.
 */
export async function joinWaitlistAction(
  prevState: JoinWaitlistState | null,
  formData: FormData
): Promise<JoinWaitlistState> {
  const validation = joinWaitlistSchema.safeParse({
    fid: formData.get("fid"),
    ref: formData.get("ref"),
  });

  if (!validation.success) {
    const error = validation.error.issues[0]?.message ?? "Invalid input.";
    return { ok: false, error };
  }

  const { fid, ref } = validation.data;

  try {
    // 1. Find the user joining
    const user = await prisma.user.findUnique({
      where: { fid },
      select: {
        id: true,
        joinedWaitlistAt: true,
        hasGameAccess: true,
        referredById: true,
      },
    });

    if (!user) {
      return { ok: false, error: "User not found." };
    }

    // 2. Check if already on waitlist or has game access
    if (user.joinedWaitlistAt || user.hasGameAccess) {
      return { ok: true, already: true };
    }

    // 3. Find referrer if one is provided
    let referrerUser: { id: string } | null = null;
    if (ref && ref !== fid) {
      referrerUser = await prisma.user.findUnique({
        where: { fid: ref },
        select: { id: true },
      });
    }

    // 4. Perform database updates in a transaction
    await prisma.$transaction(async (tx) => {
      // a. Record waitlist join timestamp and link referrer if not already linked
      await tx.user.update({
        where: { id: user.id },
        data: {
          joinedWaitlistAt: new Date(),
          referredById:
            referrerUser && !user.referredById ? referrerUser.id : undefined,
        },
      });

      // b. If a referrer was found, reward them with points and log the reward
      if (referrerUser) {
        // Add points to referrer's waitlistPoints
        await tx.user.update({
          where: { id: referrerUser.id },
          data: {
            inviteQuota: { increment: 1 },
            waitlistPoints: { increment: REFERRAL_BONUS_POINTS },
          },
        });

        // Log this referral event
        await tx.referralReward.create({
          data: {
            inviterId: referrerUser.id,
            inviteeId: user.id,
            status: "UNLOCKED",
            amount: REFERRAL_BONUS_POINTS,
            unlockedAt: new Date(),
          },
        });
      }
    });

    revalidatePath("/waitlist");
    return { ok: true, already: false };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { ok: true, already: true, error: "Referral already logged." };
    }
    console.error("Error joining waitlist:", error);
    // Handle potential race condition where reward was already created
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { ok: true, already: true, error: "Referral already logged." };
    }
    return { ok: false, error: "An unexpected error occurred." };
  }
}

export type CompleteQuestState = {
  success: boolean;
  message?: string;
  error?: string;
  pendingApproval?: boolean;
};

/**
 * Complete a quest for the current user.
 * Uses database-driven quests with proper verification.
 */
export async function completeWaitlistQuest(
  prevState: CompleteQuestState | null,
  formData: FormData
): Promise<CompleteQuestState> {
  try {
    const fid = Number(formData.get("fid"));
    const questSlug = formData.get("questId") as string; // Now using slug

    if (!fid || !questSlug) {
      return { success: false, error: "Missing FID or Quest ID" };
    }

    // 1. Get user with their referral count and completed quests
    const user = await prisma.user.findUnique({
      where: { fid },
      select: {
        id: true,
        completedQuests: {
          select: {
            questId: true,
            quest: { select: { slug: true } },
            completedAt: true,
          },
        },
        _count: {
          select: { referrals: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // 2. Find the quest from database
    const quest = await prisma.quest.findUnique({
      where: { slug: questSlug },
    });

    if (!quest) {
      return { success: false, error: "Quest not found" };
    }

    // 3. Check if quest is active and within schedule
    if (!quest.isActive) {
      return { success: false, error: "This quest is no longer available" };
    }

    const now = new Date();
    if (quest.startsAt && now < quest.startsAt) {
      return { success: false, error: "This quest hasn't started yet" };
    }
    if (quest.endsAt && now > quest.endsAt) {
      return { success: false, error: "This quest has ended" };
    }

    // 4. Check if already completed (for non-repeatable quests)
    const existingCompletion = user.completedQuests.find(
      (cq) => cq.quest.slug === questSlug
    );

    if (existingCompletion && quest.repeatFrequency === "ONCE") {
      return { success: true, message: "Quest already completed" };
    }

    // For repeatable quests, check cooldown
    if (existingCompletion && quest.repeatFrequency !== "ONCE") {
      const lastCompleted = existingCompletion.completedAt;
      const cooldownMs =
        quest.repeatFrequency === "DAILY"
          ? 24 * 60 * 60 * 1000
          : quest.repeatFrequency === "WEEKLY"
          ? 7 * 24 * 60 * 60 * 1000
          : 0;

      if (
        cooldownMs > 0 &&
        now.getTime() - lastCompleted.getTime() < cooldownMs
      ) {
        const timeLeft = Math.ceil(
          (cooldownMs - (now.getTime() - lastCompleted.getTime())) /
            (60 * 60 * 1000)
        );
        return {
          success: false,
          error: `Quest available again in ${timeLeft} hours`,
        };
      }
    }

    // 5. Verify quest based on type
    switch (quest.type) {
      case "FARCASTER_FOLLOW":
        if (quest.targetFid) {
          try {
            const isFollowing = await verifyFarcasterFollow(
              fid,
              quest.targetFid
            );
            if (!isFollowing) {
              return {
                success: false,
                error: "Please follow the account first, then try again",
              };
            }
          } catch (error) {
            console.error(
              `[QUEST_VERIFY] Follow verification failed, allowing:`,
              error
            );
          }
        }
        break;

      case "FARCASTER_CAST":
        if (quest.targetFid) {
          try {
            const hasMentioned = await verifyFarcasterMention(
              fid,
              quest.targetFid
            );
            if (!hasMentioned) {
              return {
                success: false,
                error: "Please tag the account in a cast first, then try again",
              };
            }
          } catch (error) {
            console.error(
              `[QUEST_VERIFY] Mention verification failed, allowing:`,
              error
            );
          }
        }
        break;

      case "REFERRAL":
        if (user._count.referrals < quest.requiredCount) {
          return {
            success: false,
            error: `You need ${quest.requiredCount} referrals to complete this quest (current: ${user._count.referrals})`,
          };
        }
        break;

      case "CUSTOM":
        // CUSTOM quests require admin approval - create pending completion
        await prisma.completedQuest.create({
          data: {
            userId: user.id,
            questId: quest.id,
            pointsAwarded: quest.points,
            isApproved: false, // Pending admin approval
          },
        });

        revalidatePath("/waitlist/quests");
        return {
          success: true,
          message: "Quest submitted for review!",
          pendingApproval: true,
        };

      // LINK and FARCASTER_RECAST use honor system
      case "LINK":
      case "FARCASTER_RECAST":
      default:
        break;
    }

    // 6. Create completion record and award points
    await prisma.$transaction([
      prisma.completedQuest.create({
        data: {
          userId: user.id,
          questId: quest.id,
          pointsAwarded: quest.points,
          isApproved: true,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          waitlistPoints: {
            increment: quest.points,
          },
        },
      }),
    ]);

    revalidatePath("/waitlist");
    revalidatePath("/waitlist/quests");
    revalidatePath("/waitlist/leaderboard");

    return {
      success: true,
      message: `Quest completed! +${quest.points} points`,
    };
  } catch (error) {
    console.error("Error completing quest:", error);
    return { success: false, error: "Failed to complete quest" };
  }
}
