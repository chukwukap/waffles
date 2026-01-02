"use server";

import { saveToken } from "@/lib/notifications";

export async function saveNotificationTokenAction(
  fid: number,
  appFid: number,
  notificationDetails: { url: string; token: string }
) {
  try {
    const result = await saveToken(fid, appFid, notificationDetails);
    return result;
  } catch (error) {
    console.error("Failed to save notification token:", error);
    return { success: false, error: "Failed to save notification token" };
  }
}
