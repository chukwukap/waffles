"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type JoinWaitlistState = {
  ok: boolean;
  already?: boolean;
  error?: string;
};

/**
 * Adds a user to the waitlist.
 */
export async function joinWaitlistAction(
  prevState: JoinWaitlistState | null,
  formData: FormData
): Promise<JoinWaitlistState> {
  const fid = formData.get("fid");
  const referrerFid = formData.get("referrerFid");

  console.log("fid", fid);
  console.log("referrerFid", referrerFid);

  if (!fid) {
    return { ok: false, error: "FID is required." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { fid: Number(fid) } });
    if (!user) {
      // Potentially create user if not found, depending on app logic.
      // For now, assume user exists from onboarding/sync.
      // user = await prisma.user.create({ data: { fid: fid } });
      return { ok: false, error: "User not found. Please sync profile first." };
    }

    const existing = await prisma.waitlist.findUnique({
      where: { userId: user.id },
    });
    if (existing) {
      return { ok: true, already: true };
    }

    let referredByUser = null;
    if (referrerFid !== null && referrerFid !== fid) {
      referredByUser = await prisma.user.findUnique({
        where: { fid: Number(referrerFid) },
      });
      if (referredByUser) {
        await prisma.waitlist.updateMany({
          where: { userId: referredByUser.id },
          data: { invites: { increment: 1 } },
        });
      }
    }

    await prisma.waitlist.create({
      data: {
        userId: user.id,
        referredBy: referredByUser?.id || null,
      },
    });

    revalidatePath("/waitlist");
    return { ok: true };
  } catch (error) {
    console.error("Error joining waitlist:", error);
    return { ok: false, error: "An unexpected error occurred." };
  }
}
