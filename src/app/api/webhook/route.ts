import { NextRequest, NextResponse } from "next/server";
import {
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/miniapp-node";
import {
  setUserNotificationDetails,
  deleteUserNotificationDetails,
  sendMiniAppNotification,
} from "@/lib/notifications";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  const requestJson = await request.json();

  // Parse and verify the webhook event
  let data;
  try {
    data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
  } catch (e: unknown) {
    console.error("Webhook verification failed:", e);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  const fid = data.fid;
  const appFid = data.appFid;
  const event = data.event;

  console.log(`Received webhook event: ${event.event} for FID ${fid}`);

  try {
    switch (event.event) {
      case "miniapp_added":
        if (event.notificationDetails) {
          await setUserNotificationDetails(
            fid,
            appFid,
            event.notificationDetails
          );
          await sendMiniAppNotification({
            fid,
            appFid,
            title: "Welcome to Waffles!",
            body: "Thanks for adding the app. You will now receive notifications.",
            targetUrl: `${env.rootUrl}/game`,
          });
        }
        break;

      case "miniapp_removed":
        await deleteUserNotificationDetails(fid, appFid);
        break;

      case "notifications_enabled":
        await setUserNotificationDetails(
          fid,
          appFid,
          event.notificationDetails
        );
        await sendMiniAppNotification({
          fid,
          appFid,
          title: "Notifications Enabled",
          body: "You will now receive updates about your games.",
          targetUrl: `${env.rootUrl}/game`,
        });
        break;

      case "notifications_disabled":
        await deleteUserNotificationDetails(fid, appFid);
        break;
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
