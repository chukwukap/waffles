"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

  try {
    // 1. Find the user joining
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true, status: true, invitedById: true },
    });

    if (!user) {
      return { ok: false, error: "User not found. Please sync profile first." };
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
