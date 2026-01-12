"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { syncUserSchema } from "@/lib/schemas";
import { Prisma } from "@prisma";
import { generateInviteCode } from "@/lib/utils";

const MAX_RETRIES = 10;

// --- Types ---
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
 * Creates a new user or updates an existing user's profile.
 */
export async function upsertUser(
  input: z.input<typeof syncUserSchema>
): Promise<SyncUserResult> {
  const validation = syncUserSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.message || "Invalid input",
    };
  }

  const { fid, username, pfpUrl, wallet } = validation.data;

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { fid } });

    let user: SyncedUser;

    if (existingUser) {
      // Update existing user
      user = await prisma.user.update({
        where: { fid },
        data: { username, pfpUrl, wallet },
        select: {
          fid: true,
          username: true,
          pfpUrl: true,
          wallet: true,
          inviteCode: true,
        },
      });
    } else {
      // Create new user with unique invite code
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          user = await prisma.user.create({
            data: {
              fid,
              username,
              pfpUrl,
              wallet,
              inviteCode: generateInviteCode(),
            },
            select: {
              fid: true,
              username: true,
              pfpUrl: true,
              wallet: true,
              inviteCode: true,
            },
          });
          break;
        } catch (err) {
          // Retry on invite code collision
          const isCodeCollision =
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002" &&
            Array.isArray(err.meta?.target) &&
            err.meta.target.includes("inviteCode");

          if (!isCodeCollision || i === MAX_RETRIES - 1) throw err;
        }
      }
    }

    revalidatePath("/game");
    return { success: true, user: user! };
  } catch (err) {
    console.error("syncUserAction Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "User sync failed",
    };
  }
}
