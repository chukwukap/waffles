"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache"; // Use revalidatePath if revalidateTag is not sufficient

const REFERRAL_CODE_LENGTH = 6;
const MAX_CODE_GENERATION_RETRIES = 10;

function generateReferralCode(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(REFERRAL_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

async function ensureReferral(
  inviterId: number
): Promise<{ code: string; existed: boolean; id: number }> {
  const existing = await prisma.referral.findFirst({
    where: { inviterId },
    orderBy: { createdAt: "asc" },
    select: { code: true, id: true },
  });
  if (existing) return { ...existing, existed: true };

  for (let attempt = 0; attempt < MAX_CODE_GENERATION_RETRIES; attempt++) {
    const code = generateReferralCode();
    try {
      const newReferral = await prisma.referral.create({
        data: {
          code,
          inviterId,
        },
        select: { code: true, id: true },
      });
      // After creating a new referral, revalidate the lobby/upcoming games path
      revalidatePath("/"); // Invalidate the home/lobby page
      return { ...newReferral, existed: false };
    } catch (err) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        err.code === "P2002"
      ) {
        console.warn(
          `Referral code collision on attempt ${attempt + 1}, retrying...`
        );
        continue;
      }
      throw err;
    }
  }
  throw new Error(
    `Failed to generate unique referral code for inviterId ${inviterId} after ${MAX_CODE_GENERATION_RETRIES} attempts.`
  );
}

const syncUserSchema = z.object({
  fid: z.number().int().positive("FID must be a positive integer."),
  username: z
    .string()
    .trim()
    .min(1, "Username cannot be empty.")
    .optional()
    .nullable(),
  pfpUrl: z.string().url("Invalid PFP URL.").optional().nullable(),
  wallet: z.string().trim().optional().nullable(),
});

type SyncedUser = {
  fid: number;
  name: string | null;
  imageUrl: string | null;
  wallet: string | null;
};
type SyncedReferral = {
  id: number;
  code: string;
};

export type SyncUserResult =
  | { success: true; user: SyncedUser; referral: SyncedReferral }
  | { success: false; error: string };

export async function syncUserAction(
  input: z.input<typeof syncUserSchema>
): Promise<SyncUserResult> {
  const validation = syncUserSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.message || "Invalid input.";
    console.warn("syncUserAction validation failed:", validation.error.message);
    return { success: false, error: firstError };
  }
  const data = validation.data;

  try {
    const user = await prisma.user.upsert({
      where: { fid: data.fid },
      update: {
        name: data.username,
        imageUrl: data.pfpUrl,
        wallet: data.wallet,
      },
      create: {
        fid: data.fid,
        name: data.username,
        imageUrl: data.pfpUrl,
        wallet: data.wallet,
      },
      select: {
        id: true,
        fid: true,
        name: true,
        imageUrl: true,
        wallet: true,
      },
    });

    try {
      const cookieStore = await cookies();
      cookieStore.set("fid", String(user.fid), {
        sameSite: "none",
        priority: "high",
        maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
        secure: process.env.NODE_ENV === "production",
      });
      console.log("cookies:", cookieStore.getAll());
    } catch (cookieErr) {
      console.warn(`Failed to set fid cookie:`, cookieErr);
      throw new Error(`Failed to set fid cookie: ${cookieErr}`);
    }

    const referral = await ensureReferral(user.id);

    return {
      success: true,
      user: {
        fid: user.fid,
        name: user.name,
        imageUrl: user.imageUrl,
        wallet: user.wallet,
      },
      referral: { id: referral.id, code: referral.code },
    };
  } catch (err) {
    console.error("syncUserAction Error:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "User sync failed due to a server error.",
    };
  }
}
