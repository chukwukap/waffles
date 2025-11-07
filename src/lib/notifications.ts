import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { z } from "zod";

// Schema for notification request/response
const sendNotificationRequestSchema = z.object({
  notificationId: z.string().max(128),
  title: z.string().max(32),
  body: z.string().max(128),
  targetUrl: z.string().max(1024),
  tokens: z.array(z.string()).max(100),
});

const sendNotificationResponseSchema = z.object({
  successfulTokens: z.array(z.string()),
  invalidTokens: z.array(z.string()),
  rateLimitedTokens: z.array(z.string()),
});

type SendNotificationRequest = z.infer<typeof sendNotificationRequestSchema>;
type SendNotificationResponse = z.infer<typeof sendNotificationResponseSchema>;

export type NotificationDetails = {
  token: string;
  url: string;
};

export type SendNotificationResult =
  | { state: "success" }
  | { state: "no_token" }
  | { state: "rate_limit" }
  | { state: "error"; error: unknown };

/**
 * Save notification details for a user and client app combination
 */
export async function saveUserNotificationDetails(
  fid: number,
  appFid: number,
  notificationDetails: NotificationDetails
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { fid } });
  if (!user) {
    throw new Error(`User with fid ${fid} not found`);
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
 * Delete notification details for a user and client app combination
 */
export async function deleteUserNotificationDetails(
  fid: number,
  appFid: number
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { fid } });
  if (!user) {
    return; // User doesn't exist, nothing to delete
  }

  await prisma.notificationToken.deleteMany({
    where: {
      userId: user.id,
      appFid,
    },
  });
}

/**
 * Get notification details for a user and client app combination
 */
export async function getUserNotificationDetails(
  fid: number,
  appFid: number
): Promise<NotificationDetails | null> {
  const user = await prisma.user.findUnique({ where: { fid } });
  if (!user) {
    return null;
  }

  const notificationToken = await prisma.notificationToken.findUnique({
    where: {
      userId_appFid: {
        userId: user.id,
        appFid,
      },
    },
  });

  if (!notificationToken) {
    return null;
  }

  return {
    token: notificationToken.token,
    url: notificationToken.url,
  };
}

/**
 * Send a notification to a user on a specific client app
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
  targetUrl?: string;
}): Promise<SendNotificationResult> {
  const notificationDetails = await getUserNotificationDetails(fid, appFid);

  if (!notificationDetails) {
    return { state: "no_token" };
  }

  // Use the app's root URL as default target URL
  const finalTargetUrl = targetUrl || env.rootUrl;

  const notificationId = crypto.randomUUID();

  const requestBody: SendNotificationRequest = {
    notificationId,
    title,
    body,
    targetUrl: finalTargetUrl,
    tokens: [notificationDetails.token],
  };

  try {
    const response = await fetch(notificationDetails.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseJson = await response.json();

    if (response.status === 200) {
      const responseBody = sendNotificationResponseSchema.safeParse(
        responseJson
      );

      if (responseBody.success === false) {
        // Malformed response
        return { state: "error", error: responseBody.error.issues };
      }

      if (responseBody.data.rateLimitedTokens.length > 0) {
        // Rate limited
        return { state: "rate_limit" };
      }

      // Check for invalid tokens and delete them
      if (responseBody.data.invalidTokens.length > 0) {
        await deleteUserNotificationDetails(fid, appFid);
      }

      return { state: "success" };
    } else {
      // Error response
      return { state: "error", error: responseJson };
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    return { state: "error", error };
  }
}

