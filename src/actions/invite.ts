"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";

interface ValidationSuccess {
  valid: true;
  message?: string;
  inviterId: number;
  inviteeId: number;
  code: string;
}

interface ValidationError {
  valid: false;
  error: string;
}

export type ValidateReferralResult = ValidationSuccess | ValidationError;

const actionSchema = z.object({
  code: z.string().length(6, "Code must be 6 characters."),
  fid: z.number().int().positive("Invalid FID format."),
});

export async function validateReferralAction(
  prevState: ValidateReferralResult | null,
  formData: FormData
): Promise<ValidateReferralResult> {
  const rawCode = formData.get("code");
  const rawFid = formData.get("fid");

  const validation = actionSchema.safeParse({
    code: rawCode,
    fid: rawFid,
  });

  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message ?? "Invalid input.";
    return { valid: false, error: firstError };
  }

  const { code, fid } = validation.data;

  try {
    const invitee = await prisma.user.findUnique({
      where: { fid },
    });
    if (!invitee) {
      return {
        valid: false,
        error: "User not found. Complete onboarding first.",
      };
    }

    const referral = await prisma.referral.findUnique({
      where: { code },
    });
    if (!referral) {
      return { valid: false, error: "Invalid code." };
    }

    if (referral.inviterId === invitee.id) {
      return { valid: false, error: "Cannot use your own code." };
    }

    const duplicate = await prisma.referral.findFirst({
      where: {
        inviterId: referral.inviterId,
        inviteeId: invitee.id,
      },
    });
    if (duplicate) {
      if (duplicate.code === code) {
        return {
          valid: true,
          message: "Code already validated.",
          inviterId: referral.inviterId,
          inviteeId: invitee.id,
          code: duplicate.code,
        };
      } else {
        return {
          valid: false,
          error: "Referral already established with this inviter.",
        };
      }
    }

    if (referral.inviteeId && referral.inviteeId !== invitee.id) {
      return { valid: false, error: "Code already redeemed by another user." };
    }

    let finalReferral = referral;
    if (!referral.inviteeId) {
      finalReferral = await prisma.referral.update({
        where: { code },
        data: { inviteeId: invitee.id, acceptedAt: new Date() },
      });
    }

    return {
      valid: true,
      inviterId: finalReferral.inviterId,
      inviteeId: finalReferral.inviteeId!,
      code: finalReferral.code,
    };
  } catch (err) {
    console.error("[VALIDATE_REFERRAL_ACTION_ERROR]", err);
    return { valid: false, error: "Validation failed due to a server error." };
  }
}

const REFERRAL_CODE_LENGTH = 6;
const MAX_CODE_GENERATION_RETRIES = 10;

function generateCode(length = REFERRAL_CODE_LENGTH): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

const inputSchema = z.object({
  fid: z.number().int().positive("Invalid FID format."),
});

export type ReferralCodeResult =
  | {
      success: true;
      code: string;
      inviterId: number;
      inviteeId?: number | null;
    }
  | { success: false; error: string };

export async function getOrCreateReferralCodeAction(
  fid: number | null | undefined
): Promise<ReferralCodeResult> {
  const validation = inputSchema.safeParse({ fid });
  if (!validation.success) {
    const firstError =
      validation.error.message || "Invalid Farcaster ID provided.";
    return { success: false, error: firstError };
  }
  const validatedFid = validation.data.fid;

  try {
    const inviter = await prisma.user.findUnique({
      where: { fid: validatedFid },
      select: { id: true },
    });

    if (!inviter) {
      return { success: false, error: "Inviter user not found." };
    }
    const inviterId = inviter.id;

    const existingReferral = await prisma.referral.findFirst({
      where: { inviterId },
      orderBy: { createdAt: "asc" },
    });

    if (existingReferral) {
      return {
        success: true,
        code: existingReferral.code,
        inviterId: existingReferral.inviterId,
        inviteeId: existingReferral.inviteeId,
      };
    }

    let newCode: string | null = null;
    for (let tries = 0; tries < MAX_CODE_GENERATION_RETRIES; tries++) {
      const potentialCode = generateCode();
      const collision = await prisma.referral.findUnique({
        where: { code: potentialCode },
      });
      if (!collision) {
        newCode = potentialCode;
        break;
      }
    } //

    if (!newCode) {
      console.error(
        `Failed to generate unique referral code for inviterId ${inviterId} after ${MAX_CODE_GENERATION_RETRIES} tries.`
      );
      return {
        success: false,
        error: "Failed to generate a unique referral code. Please try again.",
      };
    }

    const newReferral = await prisma.referral.create({
      data: {
        code: newCode,
        inviterId,
      },
    });

    return {
      success: true,
      code: newReferral.code,
      inviterId: newReferral.inviterId,
      inviteeId: newReferral.inviteeId,
    };
  } catch (err) {
    console.error("Error in getOrCreateReferralCodeAction:", err);
    return {
      success: false,
      error: "An unexpected error occurred while processing the referral code.",
    };
  }
}

export type UserInviteCode = {
  code: string | null;
};

export async function getUserInviteDataAction(
  fid: number
): Promise<UserInviteCode | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { fid },
      select: {
        referrals: {
          take: 1,
          select: {
            code: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      code: user.referrals[0]?.code || null,
    };
  } catch (err) {
    console.error("[GET_USER_INVITE_DATA_ERROR]", err);
    return null;
  }
}
