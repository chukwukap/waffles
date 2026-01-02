import { NextRequest, NextResponse } from "next/server";
import {
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/miniapp-node";
import {
  handleWebhookEvent,
  sendWelcomeNotification,
  LOG_PREFIX,
} from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const requestJson = await request.json();

  // 1. Verify webhook signature
  let data;
  try {
    data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
  } catch (error) {
    console.error(`${LOG_PREFIX} Webhook verification failed:`, error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2. Handle event (FAST - just save token to DB)
  const result = await handleWebhookEvent({
    fid: data.fid,
    appFid: data.appFid,
    event: data.event.event,
    notificationDetails:
      "notificationDetails" in data.event
        ? data.event.notificationDetails
        : undefined,
  });

  // 3. Return response IMMEDIATELY (critical for Baseapp)
  const response = NextResponse.json({ success: result.success });

  // 4. Send welcome notification AFTER response (fire-and-forget)
  if (result.shouldSendWelcome) {
    // Use setImmediate to ensure this runs after response is sent
    setImmediate(() => {
      sendWelcomeNotification(data.fid).catch((e) =>
        console.error(`${LOG_PREFIX} Async welcome failed:`, e)
      );
    });
  }

  return response;
}
