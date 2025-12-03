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
    console.log("[WEBHOOK_NOTIFY] Event verified successfully");
  } catch (e: unknown) {
    console.error("[WEBHOOK_NOTIFY] Verification failed:", e);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  const fid = data.fid;
  const appFid = data.appFid;
  const event = data.event;

  console.log(
    `[WEBHOOK_NOTIFY] Event: ${event.event}, FID: ${fid}, AppFID: ${appFid}`
  );

  try {
    switch (event.event) {
      case "miniapp_added":
        console.log(`[WEBHOOK_NOTIFY] Processing miniapp_added for FID ${fid}`);
        if (event.notificationDetails) {
          console.log(
            `[WEBHOOK_NOTIFY] Saving notification details for FID ${fid}`
          );
          await setUserNotificationDetails(
            fid,
            appFid,
            event.notificationDetails
          );

          console.log(
            `[WEBHOOK_NOTIFY] Sending welcome notification to FID ${fid}`
          );
          await sendMiniAppNotification({
            fid,
            appFid,
            title: "Welcome to Waffles!",
            body: "Thanks for adding the app. You will now receive notifications.",
            targetUrl: `${env.rootUrl}${env.homeUrlPath}`,
          });
          console.log(
            `[WEBHOOK_NOTIFY] Welcome notification sent to FID ${fid}`
          );
        } else {
          console.log(
            `[WEBHOOK_NOTIFY] No notification details provided for FID ${fid}`
          );
        }
        break;

      case "miniapp_removed":
        console.log(
          `[WEBHOOK_NOTIFY] Processing miniapp_removed for FID ${fid}`
        );
        await deleteUserNotificationDetails(fid, appFid);
        console.log(
          `[WEBHOOK_NOTIFY] Notification details deleted for FID ${fid}`
        );
        break;

      case "notifications_enabled":
        console.log(
          `[WEBHOOK_NOTIFY] Processing notifications_enabled for FID ${fid}`
        );
        await setUserNotificationDetails(
          fid,
          appFid,
          event.notificationDetails
        );
        console.log(
          `[WEBHOOK_NOTIFY] Notification details saved for FID ${fid}`
        );

        await sendMiniAppNotification({
          fid,
          appFid,
          title: "Notifications Enabled",
          body: "You will now receive updates about your games.",
          targetUrl: `${env.rootUrl}${env.homeUrlPath}`,
        });
        console.log(
          `[WEBHOOK_NOTIFY] Notification enabled message sent to FID ${fid}`
        );
        break;

      case "notifications_disabled":
        console.log(
          `[WEBHOOK_NOTIFY] Processing notifications_disabled for FID ${fid}`
        );
        await deleteUserNotificationDetails(fid, appFid);
        console.log(
          `[WEBHOOK_NOTIFY] Notification details deleted for FID ${fid}`
        );
        break;

      default:
        console.log(
          `[WEBHOOK_NOTIFY] Unknown event type: ${event} for FID ${fid}`
        );
    }

    console.log(
      `[WEBHOOK_NOTIFY] Successfully processed ${event.event} for FID ${fid}`
    );
  } catch (error) {
    console.error(
      `[WEBHOOK_NOTIFY] Error processing ${event.event} for FID ${fid}:`,
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
