"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { QUESTS } from "@/lib/quests";

// Derive quest points from the source of truth
const QUEST_POINTS = QUESTS.reduce((acc: Record<string, number>, quest) => {
  acc[quest.id] = quest.points;
  return acc;
}, {} as Record<string, number>);
import { z } from "zod";
import { Prisma } from "../../prisma/generated/client";
import { verifyFarcasterFollow } from "@/lib/verifyFarcasterFollow";
import { verifyFarcasterMention } from "@/lib/verifyFarcasterMention";

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
 * Adds a user to the waitlist by setting their User.status to WAITLIST.
 * If a referrer FID is provided, it links the referral and increments
 * the referrer's invite quota.
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
      select: { id: true, status: true, invitedById: true },
    });

    if (!user) {
      return { ok: false, error: "User not found." };
    }

    // 2. Check if already active or on list
    if (user.status === "ACTIVE" || user.status === "WAITLIST") {
      return { ok: true, already: true };
    }

    // 3. Find referrer if one is provided
    let referrerUser: { id: number } | null = null;
    if (ref && ref !== fid) {
      referrerUser = await prisma.user.findUnique({
        where: { fid: ref },
        select: { id: true },
      });
    }

    // 4. Perform database updates in a transaction
    await prisma.$transaction(async (tx) => {
      // a. Update the user's status to WAITLIST
      //    If referrer exists AND user isn't already linked, link them.
      await tx.user.update({
        where: { id: user.id },
        data: {
          status: "WAITLIST",
          invitedById:
            referrerUser && !user.invitedById ? referrerUser.id : undefined,
        },
      });

      // b. If a referrer was found, increment their quota and log the reward
      if (referrerUser) {
        // Increment referrer's invite quota by 1 for the successful referral
        await tx.user.update({
          where: { id: referrerUser.id },
          data: {
            inviteQuota: { increment: 1 },
          },
        });

        // Log this referral event
        await tx.referralReward.create({
          data: {
            inviterId: referrerUser.id,
            inviteeId: user.id,
            status: "PENDING", // Waitlist referrals are pending
            amount: 0, // Or grant points/rewards as needed
          },
        });
      }
    });

    // Track analytics

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
};

export async function completeWaitlistQuest(
  prevState: CompleteQuestState | null,
  formData: FormData
): Promise<CompleteQuestState> {
  try {
    const fid = Number(formData.get("fid"));
    const questId = formData.get("questId") as string;

    if (!fid || !questId) {
      return { success: false, error: "Missing FID or Quest ID" };
    }

    const user = await prisma.user.findUnique({
      where: { fid },
      select: {
        id: true,
        completedTasks: true, // DB field remains completedTasks
        _count: {
          select: { invites: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Find the quest definition
    const quest = QUESTS.find((t) => t.id === questId);

    // Verify Farcaster quests if verifiable
    if (quest?.verifiable && quest.targetFid) {
      try {
        let isVerified = false;

        if (questId === "share_waitlist_farcaster") {
          // For share quests, verify they mentioned @wafflesdotfun
          isVerified = await verifyFarcasterMention(fid, quest.targetFid);

          if (!isVerified) {
            return {
              success: false,
              error:
                "Please tag @wafflesdotfun in a cast first, then try again",
            };
          }
        } else {
          // For follow quests, verify they follow
          isVerified = await verifyFarcasterFollow(fid, quest.targetFid);

          if (!isVerified) {
            return {
              success: false,
              error: "Please follow @wafflesdotfun first, then try again",
            };
          }
        }
      } catch (error) {
        // Graceful fallback: If Neynar API fails, allow completion anyway
        console.error(
          `[QUEST_VERIFY] Neynar API failed for FID ${fid}, quest ${questId}, allowing completion:`,
          error
        );
      }
    }

    // Verify "invite_three_friends" quest
    if (questId === "invite_three_friends") {
      if (user._count.invites < 3) {
        return {
          success: false,
          error: "You need 3 invites to complete this quest.",
        };
      }
    }

    // Check if already completed
    if (user.completedTasks.includes(questId)) {
      return { success: true, message: "Quest already completed" };
    }

    // Get points for this quest
    const pointsToAward = QUEST_POINTS[questId] || 0;

    // Add quest to completed list and award points
    await prisma.user.update({
      where: { id: user.id },
      data: {
        completedTasks: {
          // DB field remains completedTasks
          push: questId,
        },
        waitlistPoints: {
          increment: pointsToAward,
        },
      },
    });

    revalidatePath("/waitlist");
    revalidatePath("/waitlist/quests");
    revalidatePath("/waitlist/leaderboard");

    return {
      success: true,
      message: `Quest completed! +${pointsToAward} points`,
    };
  } catch (error) {
    console.error("Error completing quest:", error);
    return { success: false, error: "Failed to complete quest" };
  }
}
