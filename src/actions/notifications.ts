"use server";

import { setUserNotificationDetails } from "@/lib/notifications";

export async function saveNotificationTokenAction(
  fid: number,
  appFid: number,
  notificationDetails: { url: string; token: string }
) {
  try {
    await setUserNotificationDetails(fid, appFid, notificationDetails);
    return { success: true };
  } catch (error) {
    console.error("Failed to save notification token:", error);
    return { success: false, error: "Failed to save notification token" };
  }
}
