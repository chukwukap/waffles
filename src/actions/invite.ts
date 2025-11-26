"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";

import { validateReferralSchema } from "@/lib/schemas";
import { trackServer } from "@/lib/analytics-server";

interface ValidationSuccess {
  valid: true;
  inviterId: number;
  inviteeId: number;
  code: string;
}

interface ValidationError {
  valid: false;
  error: string;
}

export type ValidateReferralResult = ValidationSuccess | ValidationError;

/**
 * Server Action: Validates an invite code and links the invitee to the inviter.
 * This is the core of the referral system.
 */
export async function validateReferralAction(
  _prevState: ValidateReferralResult | null,
  formData: FormData
): Promise<ValidateReferralResult> {
  const validation = validateReferralSchema.safeParse({
    code: formData.get("code"),
    fid: formData.get("fid"),
  });

  if (!validation.success) {
    const error = validation.error.issues[0]?.message ?? "Invalid input.";
    return { valid: false, error };
  }

  const { code, fid } = validation.data;

  try {
    // 1. Find the inviter (by their share code) and invitee (by their FID)
    const [inviter, invitee] = await Promise.all([
      prisma.user.findUnique({
        where: { inviteCode: code },
        select: { id: true, inviteQuota: true },
      }),
      prisma.user.findUnique({
        where: { fid },
        select: { id: true, invitedById: true, status: true },
      }),
    ]);

    // 2. Run Validation Checks
    if (!invitee) {
      await trackServer("invite_failed", {
        fid,
        reason: "user_not_found",
        code,
      });
      return {
        valid: false,
        error: "Your user account was not found.",
      };
    }
    if (!inviter) {
      await trackServer("invite_failed", {
        fid,
        reason: "invalid_code",
        code,
      });
      return { valid: false, error: "Invalid code." };
    }
    if (inviter.id === invitee.id) {
      await trackServer("invite_failed", {
        fid,
        reason: "self_invite",
        code,
      });
      return { valid: false, error: "You cannot invite yourself." };
    }

    // CHANGED: Logic to allow waitlisted users to be activated
    // If user is already ACTIVE, we enforce strict referral rules (cannot change referrer)
    if (invitee.status === "ACTIVE") {
      if (invitee.invitedById) {
        if (invitee.invitedById === inviter.id) {
          return {
            valid: true,
            inviterId: inviter.id,
            inviteeId: invitee.id,
            code: code,
          };
        }
        return {
          valid: false,
          error: "You have already accepted an invite from someone else.",
        };
      }
      return { valid: false, error: "You have already accepted an invite." };
    }

    // If user is NOT ACTIVE (e.g. WAITLIST or NONE), we allow them to proceed.
    // This will overwrite their invitedById (if any) and set them to ACTIVE.

    if (inviter.inviteQuota <= 0) {
      await trackServer("invite_failed", {
        fid,
        reason: "quota_exhausted",
        code,
      });
      return { valid: false, error: "Inviter has no invites left." };
    }

    // 3. All checks passed. Perform the referral in a transaction.
    await prisma.$transaction(async (tx) => {
      // a. Decrement inviter's quota - strictly ensure > 0 to prevent race conditions
      const quotaUpdate = await tx.user.updateMany({
        where: { id: inviter.id, inviteQuota: { gt: 0 } },
        data: { inviteQuota: { decrement: 1 } },
      });

      if (quotaUpdate.count === 0) {
        throw new Error("Inviter has no invites left.");
      }

      // b. Link invitee to inviter
      await tx.user.update({
        where: { id: invitee.id },
        data: {
          invitedById: inviter.id,
          status: "ACTIVE", // <-- Activate the user!
        },
      });

      // c. Log or Update the reward event
      // Use upsert to handle case where user was already referred on waitlist
      await tx.referralReward.upsert({
        where: { inviteeId: invitee.id },
        update: {
          inviterId: inviter.id, // Update to the new inviter (the one who activated them)
          status: "PENDING",
        },
        create: {
          inviterId: inviter.id,
          inviteeId: invitee.id,
          status: "PENDING",
          amount: 0,
        },
      });
    });

    // Track successful invite redemption
    await trackServer("invite_redeemed", {
      fid,
      inviterFid: inviter.id,
      code,
    });

    return {
      valid: true,
      inviterId: inviter.id,
      inviteeId: invitee.id,
      code,
    };
  } catch (err) {
    console.error("[VALIDATE_REFERRAL_ACTION_ERROR]", err);
    return { valid: false, error: "Validation failed due to a server error." };
  }
}

/**
 * Server Action: Fetches the invite code for the logged-in user.
 * (Used on the /invite client page)
 */
export type UserInviteData = {
  code: string | null;
};

export async function getUserInviteDataAction(
  fid: number
): Promise<UserInviteData> {
  const validation = z.number().int().positive().safeParse(fid);
  if (!validation.success) {
    console.warn("getUserInviteDataAction: Invalid FID", fid);
    return { code: null };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { inviteCode: true },
    });

    if (!user) {
      return { code: null };
    }

    return { code: user.inviteCode };
  } catch (err) {
    console.error("[GET_USER_INVITE_DATA_ERROR]", err);
    return { code: null };
  }
}
