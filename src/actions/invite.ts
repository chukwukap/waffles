"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";

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

const validateSchema = z.object({
  code: z.string().length(6, "Code must be 6 characters."),
  fid: z.coerce.number().int().positive("Invalid FID format."),
});

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
    // Fetch invitee and referral in parallel
    const [invitee, referral] = await Promise.all([
      prisma.user.findUnique({
        where: { fid },
        select: { id: true },
      }),
      prisma.referral.findUnique({
        where: { code },
        select: {
          inviterId: true,
          inviteeId: true,
          code: true,
        },
      }),
    ]);

    if (!invitee) {
      return { valid: false, error: "User not found. Complete onboarding first." };
    }

    if (!referral) {
      return { valid: false, error: "Invalid code." };
    }

    if (referral.inviterId === invitee.id) {
      return { valid: false, error: "Cannot use your own code." };
    }

    if (referral.inviteeId) {
      if (referral.inviteeId === invitee.id) {
        // Already validated by this user
        return {
          valid: true,
          inviterId: referral.inviterId,
          inviteeId: invitee.id,
          code: referral.code,
        };
      }
      return { valid: false, error: "Code already redeemed by another user." };
    }

    // Check for existing referral relationship
    const existingReferral = await prisma.referral.findFirst({
      where: {
        inviterId: referral.inviterId,
        inviteeId: invitee.id,
      },
      select: { code: true },
    });

    if (existingReferral) {
      if (existingReferral.code === code) {
        return {
          valid: true,
          inviterId: referral.inviterId,
          inviteeId: invitee.id,
          code: referral.code,
        };
      }
      return { valid: false, error: "Referral already established with this inviter." };
    }

    // Create referral relationship
    const updatedReferral = await prisma.referral.update({
      where: { code },
      data: {
        inviteeId: invitee.id,
        acceptedAt: new Date(),
      },
      select: {
        inviterId: true,
        inviteeId: true,
        code: true,
      },
    });

    return {
      valid: true,
      inviterId: updatedReferral.inviterId,
      inviteeId: updatedReferral.inviteeId!,
      code: updatedReferral.code,
    };
  } catch (err) {
    console.error("[VALIDATE_REFERRAL_ACTION_ERROR]", err);
    return { valid: false, error: "Validation failed due to a server error." };
  }
}

const CODE_LENGTH = 6;
const MAX_RETRIES = 10;
const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length])
    .join("");
}

const referralCodeSchema = z.object({
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
  const validation = referralCodeSchema.safeParse({ fid });
  if (!validation.success) {
    const error = validation.error.issues[0]?.message ?? "Invalid FID format.";
    return { success: false, error };
  }

  try {
    const inviter = await prisma.user.findUnique({
      where: { fid: validation.data.fid },
      select: { id: true },
    });

    if (!inviter) {
      return { success: false, error: "User not found." };
    }

    const existingReferral = await prisma.referral.findFirst({
      where: { inviterId: inviter.id },
      orderBy: { createdAt: "asc" },
      select: {
        code: true,
        inviterId: true,
        inviteeId: true,
      },
    });

    if (existingReferral) {
      return {
        success: true,
        code: existingReferral.code,
        inviterId: existingReferral.inviterId,
        inviteeId: existingReferral.inviteeId,
      };
    }

    // Generate unique code
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const code = generateCode();
      const exists = await prisma.referral.findUnique({
        where: { code },
        select: { code: true },
      });

      if (!exists) {
        const newReferral = await prisma.referral.create({
          data: { code, inviterId: inviter.id },
          select: {
            code: true,
            inviterId: true,
            inviteeId: true,
          },
        });

        return {
          success: true,
          code: newReferral.code,
          inviterId: newReferral.inviterId,
          inviteeId: newReferral.inviteeId,
        };
      }
    }

    console.error(
      `Failed to generate unique code for inviterId ${inviter.id} after ${MAX_RETRIES} attempts`
    );
    return {
      success: false,
      error: "Failed to generate a unique referral code. Please try again.",
    };
  } catch (err) {
    console.error("[GET_OR_CREATE_REFERRAL_CODE_ERROR]", err);
    return {
      success: false,
      error: "An unexpected error occurred.",
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
      select: { id: true },
    });

    if (!user) {
      return { code: null };
    }

    const referral = await prisma.referral.findFirst({
      where: { inviterId: user.id },
      select: { code: true },
      orderBy: { createdAt: "asc" },
    });

    return { code: referral?.code ?? null };
  } catch (err) {
    console.error("[GET_USER_INVITE_DATA_ERROR]", err);
    return { code: null };
  }
}
