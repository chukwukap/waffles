"use server";

import { prisma } from "@/lib/db";

/**
 * Saves a notification token for a user after they add the mini app to their collection.
 */
export async function saveNotificationTokenAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const fid = formData.get("fid");
  const token = formData.get("token");
  const url = formData.get("url");

  if (!fid || !token || !url) {
    return { ok: false, error: "FID, token, and URL are required." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { fid: Number(fid) } });
    if (!user) {
      return { ok: false, error: "User not found." };
    }

    // Upsert: update if exists, create if not
    await prisma.notificationToken.upsert({
      where: { userId: user.id },
      update: {
        token: String(token),
        url: String(url),
      },
      create: {
        userId: user.id,
        token: String(token),
        url: String(url),
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("Error saving notification token:", error);
    return { ok: false, error: "An unexpected error occurred." };
  }
}
