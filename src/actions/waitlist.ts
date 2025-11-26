"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TASKS } from "@/app/(app)/waitlist/tasks/client";

// Derive task points from the source of truth
const TASK_POINTS = TASKS.reduce((acc: Record<string, number>, task) => {
  acc[task.id] = task.points;
  return acc;
}, {} as Record<string, number>);
import { z } from "zod";
import { Prisma } from "../../prisma/generated/client";
import { trackServer } from "@/lib/analytics-server";
import { checkRateLimit, waitlistRateLimit } from "@/lib/ratelimit";

export type JoinWaitlistState = {
  ok: boolean;
  already?: boolean;
  error?: string;
};

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

  // Rate limiting: 5 waitlist joins per hour per FID
  const rateLimitResult = await checkRateLimit(
    waitlistRateLimit,
    `waitlist:${fid}`
  );

  if (!rateLimitResult.success) {
    const resetTime =
      typeof rateLimitResult.reset === "number"
        ? rateLimitResult.reset
        : rateLimitResult.reset.getTime();
    const minutesUntilReset = Math.ceil((resetTime - Date.now()) / 60000);

    return {
      ok: false,
      error: `Too many attempts. Please try again in ${minutesUntilReset} minutes.`,
    };
  }

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
    await trackServer("waitlist_joined", {
      fid,
      hasReferrer: !!referrerUser,
      referrerFid: ref || undefined,
    });

    if (referrerUser) {
      await trackServer("waitlist_referral", {
        inviterFid: ref!,
        inviteeFid: fid,
      });
    }

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

export type CompleteTaskState = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function completeWaitlistTask(
  prevState: CompleteTaskState | null,
  formData: FormData
): Promise<CompleteTaskState> {
  try {
    const fid = Number(formData.get("fid"));
    const taskId = formData.get("taskId") as string;

    if (!fid || !taskId) {
      return { success: false, error: "Missing FID or Task ID" };
    }

    const user = await prisma.user.findUnique({
      where: { fid },
      select: {
        id: true,
        completedTasks: true,
        _count: {
          select: { invites: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify "invite_three_friends" task
    if (taskId === "invite_three_friends") {
      if (user._count.invites < 3) {
        return {
          success: false,
          error: "You need 3 invites to complete this task.",
        };
      }
    }

    // Check if already completed
    if (user.completedTasks.includes(taskId)) {
      return { success: true, message: "Task already completed" };
    }

    // Get points for this task
    const pointsToAward = TASK_POINTS[taskId] || 0;

    // Add task to completed list and award points
    await prisma.user.update({
      where: { id: user.id },
      data: {
        completedTasks: {
          push: taskId,
        },
        waitlistPoints: {
          increment: pointsToAward,
        },
      },
    });

    revalidatePath("/waitlist");
    revalidatePath("/waitlist/tasks");
    revalidatePath("/waitlist/leaderboard");

    return {
      success: true,
      message: `Task completed! +${pointsToAward} points`,
    };
  } catch (error) {
    console.error("Error completing task:", error);
    return { success: false, error: "Failed to complete task" };
  }
}
