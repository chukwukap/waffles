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
 * Send a notification to a user with retry logic for rate limits
 */
export async function sendMiniAppNotification({
  fid,
  appFid,
  title,
  body,
  targetUrl,
  maxRetries = 3,
}: {
  fid: number;
  appFid: number;
  title: string;
  body: string;
  targetUrl: string;
  maxRetries?: number;
}): Promise<SendMiniAppNotificationResult> {
  const notificationDetails = await getUserNotificationDetails(fid, appFid);

  if (!notificationDetails) {
    console.log(`[Notification] No token for fid ${fid}, appFid ${appFid}`);
    return { state: "no_token" };
  }

  let lastResult: SendMiniAppNotificationResult = {
    state: "error",
    error: "Unknown error",
  };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Exponential backoff: 0ms, 1000ms, 2000ms, 4000ms
    if (attempt > 0) {
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(
        `[Notification] Rate limited, retrying in ${delay}ms (attempt ${
          attempt + 1
        }/${maxRetries + 1})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
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
          // Rate limited - retry if attempts remaining
          lastResult = { state: "rate_limit" };
          continue;
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
      console.error("[Notification] Failed to send:", {
        fid,
        appFid,
        error: error instanceof Error ? error.message : error,
        url: notificationDetails.url,
      });
      return { state: "error", error };
    }
  }

  // Exhausted all retries
  console.warn(
    `[Notification] Rate limit persisted after ${
      maxRetries + 1
    } attempts for fid ${fid}`
  );
  return lastResult;
}

/**
 * Get count of users with notification tokens
 */
export async function getNotificationEnabledUserCount(
  filter?: "all" | "active" | "waitlist"
): Promise<number> {
  const where: any = {
    notifs: {
      some: {},
    },
  };

  if (filter === "active") {
    where.hasGameAccess = true;
    where.isBanned = false;
  } else if (filter === "waitlist") {
    where.hasGameAccess = false;
    where.joinedWaitlistAt = { not: null };
  }

  return prisma.user.count({ where });
}

/**
 * Get all users with notification tokens based on filter
 */
export async function getUsersWithNotifications(
  filter?: "all" | "active" | "waitlist"
) {
  const where: any = {
    notifs: {
      some: {},
    },
  };

  if (filter === "active") {
    where.hasGameAccess = true;
    where.isBanned = false;
  } else if (filter === "waitlist") {
    where.hasGameAccess = false;
    where.joinedWaitlistAt = { not: null };
  }

  return prisma.user.findMany({
    where,
    select: {
      fid: true,
      username: true,
      notifs: {
        select: {
          appFid: true,
        },
      },
    },
  });
}

/**
 * Send bulk notifications to multiple users
 * Returns summary of results
 */
export async function sendBulkNotifications({
  title,
  body,
  targetUrl,
  appFid,
  filter = "all",
  batchSize = 10,
  delayBetweenBatches = 1000,
}: {
  title: string;
  body: string;
  targetUrl: string;
  appFid: number;
  filter?: "all" | "active" | "waitlist";
  batchSize?: number;
  delayBetweenBatches?: number;
}): Promise<{
  total: number;
  success: number;
  failed: number;
  noToken: number;
  rateLimited: number;
}> {
  const users = await getUsersWithNotifications(filter);

  const results = {
    total: users.length,
    success: 0,
    failed: 0,
    noToken: 0,
    rateLimited: 0,
  };

  // Process in batches
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);

    // Send notifications in parallel within batch
    const batchResults = await Promise.all(
      batch.map((user) =>
        sendMiniAppNotification({
          fid: user.fid,
          appFid,
          title,
          body,
          targetUrl,
          maxRetries: 2,
        })
      )
    );

    // Count results
    for (const result of batchResults) {
      switch (result.state) {
        case "success":
          results.success++;
          break;
        case "no_token":
          results.noToken++;
          break;
        case "rate_limit":
          results.rateLimited++;
          break;
        case "error":
          results.failed++;
          break;
      }
    }

    // Delay between batches to avoid rate limits
    if (i + batchSize < users.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }

    console.log(
      `[BulkNotification] Processed batch ${
        Math.floor(i / batchSize) + 1
      }/${Math.ceil(users.length / batchSize)}`
    );
  }

  console.log(`[BulkNotification] Complete:`, results);
  return results;
}
