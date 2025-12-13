"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { syncUserSchema } from "@/lib/schemas";
import { Prisma } from "@/lib/db";

// --- 6-Character Code Generation ---
const REFERRAL_CODE_LENGTH = 6;
const MAX_CODE_GENERATION_RETRIES = 10;
const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateReferralCode(): string {
  const bytes = new Uint8Array(REFERRAL_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length])
    .join("");
}

// --- Action Return Types (Simplified) ---
type SyncedUser = {
  fid: number;
  username: string | null;
  pfpUrl: string | null;
  wallet: string | null;
  inviteCode: string;
};

export type SyncUserResult =
  | { success: true; user: SyncedUser }
  | { success: false; error: string };

/**
 * Server Action: Creates a new user (with a unique invite code) or
 * updates an existing user's profile information.
 */
export async function syncUserAction(
  input: z.input<typeof syncUserSchema>
): Promise<SyncUserResult> {
  const validation = syncUserSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.message || "Invalid input.";
    console.warn("syncUserAction validation failed:", validation.error.message);
    return { success: false, error: firstError };
  }

  const { fid, username, pfpUrl, wallet } = validation.data;
  const updateData = { username, pfpUrl, wallet };

  try {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { fid },
    });

    let user: SyncedUser;

    if (existingUser) {
      // 2. USER EXISTS: Update their profile
      const updatedUser = await prisma.user.update({
        where: { fid },
        data: updateData,
        select: {
          fid: true,
          username: true,
          pfpUrl: true,
          wallet: true,
          inviteCode: true,
        },
      });
      user = updatedUser;
    } else {
      // 3. NEW USER: Create them with a unique invite code
      let newInviteCode = "";
      let created = false;

      for (let attempt = 0; attempt < MAX_CODE_GENERATION_RETRIES; attempt++) {
        newInviteCode = generateReferralCode();
        try {
          const newUser = await prisma.user.create({
            data: {
              fid,
              username,
              pfpUrl,
              wallet,
              inviteCode: newInviteCode,
            },
            select: {
              fid: true,
              username: true,
              pfpUrl: true,
              wallet: true,
              inviteCode: true,
            },
          });
          user = newUser;
          created = true;
          break; // Success!
        } catch (err: unknown) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            "code" in err &&
            err.code === "P2002" &&
            "meta" in err &&
            typeof err.meta === "object" &&
            err.meta &&
            "target" in err.meta &&
            Array.isArray(err.meta.target) &&
            err.meta.target.includes("inviteCode")
          ) {
            // Unique constraint violation on inviteCode. Loop will retry.
            console.warn(
              `Invite code collision for ${newInviteCode}, retrying...`
            );
          } else {
            // Different error, throw it
            throw err;
          }
        }
      }

      if (!created) {
        throw new Error(
          `Failed to create user: Could not generate a unique invite code after ${MAX_CODE_GENERATION_RETRIES} attempts.`
        );
      }
    }

    // 4. Set cookie
    try {
      (await cookies()).set("fid", String(user!.fid), {
        sameSite: "none",
        priority: "high",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        secure: process.env.NODE_ENV === "production",
      });
    } catch (cookieErr) {
      console.warn(`Failed to set fid cookie:`, cookieErr);
      // Don't fail the whole action, just log the warning
    }

    // 5. Revalidate lobby path and return success
    revalidatePath("/game");
    return { success: true, user: user! };
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
