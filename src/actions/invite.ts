"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";

import { validateReferralSchema } from "@/lib/schemas";

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
export async function redeemInviteCodeAction(
  _prevState: ValidateReferralResult | null,
  formData: FormData
): Promise<ValidateReferralResult> {
  const validation = validateReferralSchema.safeParse({
    code: formData.get("inviteCode"),
    fid: formData.get("userFid"),
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
        select: { id: true, hasGameAccess: true, accessGrantedBy: true },
      }),
    ]);

    // 2. Run Validation Checks
    if (!invitee) {
      return {
        valid: false,
        error: "Your user account was not found.",
      };
    }
    if (!inviter) {
      return { valid: false, error: "Invalid code." };
    }
    if (inviter.id === invitee.id) {
      return { valid: false, error: "You cannot invite yourself." };
    }

    // If user already has game access, return success (idempotent)
    if (invitee.hasGameAccess) {
      return {
        valid: true,
        inviterId: invitee.accessGrantedBy ?? inviter.id,
        inviteeId: invitee.id,
        code: code,
      };
    }

    // Check inviter has quota
    if (inviter.inviteQuota <= 0) {
      return { valid: false, error: "Inviter has no invites left." };
    }

    // 3. All checks passed. Perform the activation in a transaction.
    await prisma.$transaction(async (tx) => {
      // a. Decrement inviter's quota - strictly ensure > 0 to prevent race conditions
      const quotaUpdate = await tx.user.updateMany({
        where: { id: inviter.id, inviteQuota: { gt: 0 } },
        data: { inviteQuota: { decrement: 1 } },
      });

      if (quotaUpdate.count === 0) {
        throw new Error("Inviter has no invites left.");
      }

      // b. Grant game access to invitee
      await tx.user.update({
        where: { id: invitee.id },
        data: {
          hasGameAccess: true,
          accessGrantedAt: new Date(),
          accessGrantedBy: inviter.id,
        },
      });

      // c. Log or Update the reward event
      await tx.referralReward.upsert({
        where: { inviteeId: invitee.id },
        update: {
          inviterId: inviter.id,
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

    return {
      valid: true,
      inviterId: inviter.id,
      inviteeId: invitee.id,
      code,
    };
  } catch (err) {
    console.error("[REDEEM_INVITE_CODE_ERROR]", err);
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
