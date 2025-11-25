import { prisma } from "@/lib/db";
import {
  SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/miniapp-node";

type SendMiniAppNotificationResult =
  | { state: "success" }
  | { state: "no_token" }
  | { state: "rate_limit" }
  | { state: "error"; error: any };

/**
 * Save or update user notification details
 */
export async function setUserNotificationDetails(
  fid: number,
  appFid: number,
  notificationDetails: { url: string; token: string }
) {
  const user = await prisma.user.findUnique({
    where: { fid },
  });

  if (!user) {
    console.warn(
      `User with FID ${fid} not found, cannot save notification token`
    );
    return;
  }

  await prisma.notificationToken.upsert({
    where: {
      userId_appFid: {
        userId: user.id,
        appFid,
      },
    },
    update: {
      token: notificationDetails.token,
      url: notificationDetails.url,
    },
    create: {
      userId: user.id,
      appFid,
      token: notificationDetails.token,
      url: notificationDetails.url,
    },
  });
}

/**
 * Delete user notification details
 */
export async function deleteUserNotificationDetails(
  fid: number,
  appFid: number
) {
  const user = await prisma.user.findUnique({
    where: { fid },
  });

  if (!user) return;

  await prisma.notificationToken.deleteMany({
    where: {
      userId: user.id,
      appFid,
    },
  });
}

/**
 * Get user notification details
 */
export async function getUserNotificationDetails(fid: number, appFid: number) {
  const user = await prisma.user.findUnique({
    where: { fid },
  });

  if (!user) return null;

  return prisma.notificationToken.findUnique({
    where: {
      userId_appFid: {
        userId: user.id,
        appFid,
      },
    },
  });
}

/**
 * Send a notification to a user
 */
export async function sendMiniAppNotification({
  fid,
  appFid,
  title,
  body,
  targetUrl,
}: {
  fid: number;
  appFid: number;
  title: string;
  body: string;
  targetUrl: string;
}): Promise<SendMiniAppNotificationResult> {
  const notificationDetails = await getUserNotificationDetails(fid, appFid);

  if (!notificationDetails) {
    return { state: "no_token" };
  }

  try {
    const response = await fetch(notificationDetails.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationId: crypto.randomUUID(),
        title,
        body,
        targetUrl,
        tokens: [notificationDetails.token],
      } satisfies SendNotificationRequest),
    });

    const responseJson = await response.json();

    if (response.status === 200) {
      const responseBody =
        sendNotificationResponseSchema.safeParse(responseJson);
      if (responseBody.success === false) {
        // Malformed response
        return { state: "error", error: responseBody.error.errors };
      }

      if (responseBody.data.result.rateLimitedTokens.length) {
        // Rate limited
        return { state: "rate_limit" };
      }

      // Handle invalid tokens if necessary (e.g., delete them)
      if (responseBody.data.result.invalidTokens.length) {
        await deleteUserNotificationDetails(fid, appFid);
      }

      return { state: "success" };
    } else {
      // Error response
      return { state: "error", error: responseJson };
    }
  } catch (error) {
    console.error("Failed to send notification:", error);
    return { state: "error", error };
  }
}
