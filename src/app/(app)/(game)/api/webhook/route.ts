import { NextRequest, NextResponse } from "next/server";
import {
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/miniapp-node";
import {
  saveUserNotificationDetails,
  deleteUserNotificationDetails,
  sendMiniAppNotification,
} from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const requestJson = await request.json();

    // Parse and verify the webhook event
    let data;
    try {
      data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
      // Events are signed by the app key of a user with a JSON Farcaster Signature.
    } catch (e: unknown) {
      // Handle verification errors (invalid data, invalid app key, etc.)
      console.error("Webhook verification error:", e);
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // Extract webhook data
    const fid = data.fid;
    const appFid = data.appFid; // The FID of the client app that the user added the Mini App to
    const event = data.event;

    // Handle different event types
    try {
      switch (event.event) {
        case "miniapp_added":
          if (event.notificationDetails) {
            await saveUserNotificationDetails(
              fid,
              appFid,
              event.notificationDetails
            );
            // Send welcome notification
            await sendMiniAppNotification({
              fid,
              appFid,
              title: "Welcome to Waffles! 🎉",
              body: "Thanks for adding Waffles to your collection",
            });
          }
          break;

        case "miniapp_removed":
          // Delete notification details
          await deleteUserNotificationDetails(fid, appFid);
          break;

        case "notifications_enabled":
          // Save new notification details and send confirmation
          if (event.notificationDetails) {
            await saveUserNotificationDetails(
              fid,
              appFid,
              event.notificationDetails
            );
            await sendMiniAppNotification({
              fid,
              appFid,
              title: "Notifications Enabled 🔔",
              body: "You'll now receive updates from Waffles",
            });
          }
          break;

        case "notifications_disabled":
          // Delete notification details
          await deleteUserNotificationDetails(fid, appFid);
          break;

        default:
          console.warn(`Unknown webhook event type: ${event}`);
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
      // Still return success to avoid retries for application errors
      // but log the error for debugging
      return NextResponse.json(
        { success: false, error: "Error processing webhook" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook request error:", error);
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
