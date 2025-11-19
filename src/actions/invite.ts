"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";

// --- Result Types (to match client expectations) ---

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

// --- Schemas ---

const validateSchema = z.object({
  // The 6-character code the user entered
  code: z.string().trim().length(6, "Code must be 6 characters.").toUpperCase(),
  // The FID of the user *using* the code
  fid: z.coerce.number().int().positive("Invalid FID format."),
});

/**
 * Server Action: Validates an invite code and links the invitee to the inviter.
 * This is the core of the referral system.
 */
export async function validateReferralAction(
  _prevState: ValidateReferralResult | null,
  formData: FormData
): Promise<ValidateReferralResult> {
  const validation = validateSchema.safeParse({
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
        select: { id: true, invitedById: true },
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
      return { valid: false, error: "Invalid invite code." };
    }
    if (inviter.id === invitee.id) {
      return { valid: false, error: "You cannot invite yourself." };
    }
    if (invitee.invitedById) {
      // User has already been referred.
      // If it's by the *same* person, it's a success.
      if (invitee.invitedById === inviter.id) {
        return {
          valid: true,
          inviterId: inviter.id,
          inviteeId: invitee.id,
          code: code,
        };
      }
      // If by a *different* person, it's an error.
      return {
        valid: false,
        error: "You have already been referred by someone else.",
      };
    }
    if (inviter.inviteQuota <= 0) {
      return { valid: false, error: "Inviter has no invites left." };
    }

    // 3. All checks passed. Perform the referral in a transaction.
    await prisma.$transaction([
      // a. Link invitee to inviter
      prisma.user.update({
        where: { id: invitee.id },
        data: {
          invitedById: inviter.id,
          status: "ACTIVE", // <-- Activate the user!
        },
      }),
      // b. Decrement inviter's quota
      prisma.user.update({
        where: { id: inviter.id },
        data: { inviteQuota: { decrement: 1 } },
      }),
      // c. Log the reward event
      prisma.referralReward.create({
        data: {
          inviterId: inviter.id,
          inviteeId: invitee.id,
          status: "PENDING", // Will be "UNLOCKED" after first game
          amount: 0, // Set your reward amount here
        },
      }),
    ]);

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
