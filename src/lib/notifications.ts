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

// ============================================================================
// CONSTANTS
// ============================================================================

const FETCH_TIMEOUT_MS = 10000; // 10 second timeout for notification API calls
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_BATCH_DELAY_MS = 1000;

// ============================================================================
// HELPER: Fetch with timeout
// ============================================================================

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Save or update user notification details
 * AppFid is required here because it comes from the webhook
 */
export async function setUserNotificationDetails(
  fid: number,
  appFid: number,
  notificationDetails: { url: string; token: string }
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { fid },
    });

    if (!user) {
      console.warn(
        `[Notification] User with FID ${fid} not found, cannot save notification token`
      );
      return false;
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

    console.log(`[Notification] Saved token for fid ${fid}, appFid ${appFid}`);
    return true;
  } catch (error) {
    console.error("[Notification] Failed to save notification details:", {
      fid,
      appFid,
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}

/**
 * Delete user notification details for a specific appFid
 */
export async function deleteUserNotificationDetails(
  fid: number,
  appFid: number
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { fid },
    });

    if (!user) return false;

    await prisma.notificationToken.deleteMany({
      where: {
        userId: user.id,
        appFid,
      },
    });

    console.log(
      `[Notification] Deleted token for fid ${fid}, appFid ${appFid}`
    );
    return true;
  } catch (error) {
    console.error("[Notification] Failed to delete notification details:", {
      fid,
      appFid,
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}

/**
 * Get ALL notification tokens for a user (across all Farcaster clients)
 * This is the main function used for SENDING notifications
 */
export async function getAllUserNotificationTokens(fid: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { fid },
      include: {
        notifs: true,
      },
    });

    if (!user) return [];

    return user.notifs;
  } catch (error) {
    console.error("[Notification] Failed to get user tokens:", {
      fid,
      error: error instanceof Error ? error.message : error,
    });
    return [];
  }
}

/**
 * Get user notification details for a specific appFid (used by webhook)
 * @deprecated Use getAllUserNotificationTokens for sending notifications
 */
export async function getUserNotificationDetails(fid: number, appFid: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { fid },
    });

    if (!user) return null;

    return await prisma.notificationToken.findUnique({
      where: {
        userId_appFid: {
          userId: user.id,
          appFid,
        },
      },
    });
  } catch (error) {
    console.error("[Notification] Failed to get notification details:", {
      fid,
      appFid,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

// ============================================================================
// SEND SINGLE NOTIFICATION
// ============================================================================

/**
 * Send a notification to a single token
 * Internal function - used by sendNotificationToUser
 */
async function sendToToken(
  token: { url: string; token: string; appFid: number },
  fid: number,
  title: string,
  body: string,
  targetUrl: string,
  maxRetries: number
): Promise<SendMiniAppNotificationResult> {
  if (!token.url || !token.token) {
    console.error("[Notification] Invalid token data for fid:", fid);
    return { state: "error", error: "Invalid token data" };
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
      const response = await fetchWithTimeout(
        token.url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notificationId: crypto.randomUUID(),
            title,
            body,
            targetUrl,
            tokens: [token.token],
          } satisfies SendNotificationRequest),
        },
        FETCH_TIMEOUT_MS
      );

      // Handle non-JSON responses gracefully
      let responseJson: any;
      try {
        responseJson = await response.json();
      } catch (parseError) {
        console.error("[Notification] Failed to parse response:", {
          fid,
          status: response.status,
          statusText: response.statusText,
        });
        return {
          state: "error",
          error: `Invalid response: ${response.status}`,
        };
      }

      if (response.status === 200) {
        const responseBody =
          sendNotificationResponseSchema.safeParse(responseJson);
        if (responseBody.success === false) {
          console.error("[Notification] Malformed response:", {
            fid,
            errors: responseBody.error.errors,
          });
          return { state: "error", error: responseBody.error.errors };
        }

        if (responseBody.data.result.rateLimitedTokens.length) {
          lastResult = { state: "rate_limit" };
          continue;
        }

        // Handle invalid tokens
        if (responseBody.data.result.invalidTokens.length) {
          console.log(
            `[Notification] Removing invalid token for fid ${fid}, appFid ${token.appFid}`
          );
          await deleteUserNotificationDetails(fid, token.appFid);
        }

        return { state: "success" };
      } else {
        console.error("[Notification] API error response:", {
          fid,
          status: response.status,
          response: responseJson,
        });
        return { state: "error", error: responseJson };
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("[Notification] Request timeout:", {
          fid,
          url: token.url,
        });
        return { state: "error", error: "Request timeout" };
      }

      console.error("[Notification] Failed to send:", {
        fid,
        error: error instanceof Error ? error.message : error,
        url: token.url,
      });
      return { state: "error", error };
    }
  }

  console.warn(
    `[Notification] Rate limit persisted after ${
      maxRetries + 1
    } attempts for fid ${fid}`
  );
  return lastResult;
}

/**
 * Send a notification to a user (attempts ALL their registered tokens)
 * This is the main function to use when sending notifications
 */
export async function sendNotificationToUser({
  fid,
  title,
  body,
  targetUrl,
  maxRetries = DEFAULT_MAX_RETRIES,
}: {
  fid: number;
  title: string;
  body: string;
  targetUrl: string;
  maxRetries?: number;
}): Promise<SendMiniAppNotificationResult> {
  // Validate inputs
  if (!fid || !title || !body || !targetUrl) {
    console.error("[Notification] Invalid input:", {
      fid,
      hasTitle: !!title,
      hasBody: !!body,
      hasTargetUrl: !!targetUrl,
    });
    return { state: "error", error: "Invalid notification parameters" };
  }

  const tokens = await getAllUserNotificationTokens(fid);

  if (tokens.length === 0) {
    console.log(`[Notification] No tokens for fid ${fid}`);
    return { state: "no_token" };
  }

  console.log(
    `[Notification] Sending to fid ${fid} (${tokens.length} token(s))`
  );

  // Try each token until one succeeds
  for (const token of tokens) {
    const result = await sendToToken(
      token,
      fid,
      title,
      body,
      targetUrl,
      maxRetries
    );

    if (result.state === "success") {
      return result;
    }
  }

  // All tokens failed
  return { state: "error", error: "All tokens failed" };
}

// ============================================================================
// USER QUERIES
// ============================================================================

/**
 * Get count of users with notification tokens
 */
export async function getNotificationEnabledUserCount(
  filter?: "all" | "active" | "waitlist" | "no_quests"
): Promise<number> {
  try {
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
    } else if (filter === "no_quests") {
      where.completedQuests = { none: {} };
    }

    return await prisma.user.count({ where });
  } catch (error) {
    console.error("[Notification] Failed to count users:", {
      filter,
      error: error instanceof Error ? error.message : error,
    });
    return 0;
  }
}

/**
 * Get all users with notification tokens based on filter
 */
export async function getUsersWithNotifications(
  filter?: "all" | "active" | "waitlist" | "no_quests"
) {
  try {
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
    } else if (filter === "no_quests") {
      where.completedQuests = { none: {} };
    }

    return await prisma.user.findMany({
      where,
      select: {
        fid: true,
        username: true,
        notifs: true, // Include all tokens
      },
    });
  } catch (error) {
    console.error("[Notification] Failed to get users:", {
      filter,
      error: error instanceof Error ? error.message : error,
    });
    return [];
  }
}

// ============================================================================
// BULK NOTIFICATIONS
// ============================================================================

/**
 * Send bulk notifications to multiple users
 * Returns summary of results
 */
export async function sendBulkNotifications({
  title,
  body,
  targetUrl,
  filter = "all",
  batchSize = DEFAULT_BATCH_SIZE,
  delayBetweenBatches = DEFAULT_BATCH_DELAY_MS,
}: {
  title: string;
  body: string;
  targetUrl: string;
  filter?: "all" | "active" | "waitlist" | "no_quests";
  batchSize?: number;
  delayBetweenBatches?: number;
}): Promise<{
  total: number;
  success: number;
  failed: number;
  noToken: number;
  rateLimited: number;
}> {
  // Validate inputs
  if (!title || !body || !targetUrl) {
    console.error("[BulkNotification] Invalid input:", {
      hasTitle: !!title,
      hasBody: !!body,
      hasTargetUrl: !!targetUrl,
    });
    return {
      total: 0,
      success: 0,
      failed: 0,
      noToken: 0,
      rateLimited: 0,
    };
  }

  console.log("[BulkNotification] Starting bulk send:", {
    filter,
    title: title.substring(0, 30) + "...",
  });

  const users = await getUsersWithNotifications(filter);

  const results = {
    total: users.length,
    success: 0,
    failed: 0,
    noToken: 0,
    rateLimited: 0,
  };

  if (users.length === 0) {
    console.log("[BulkNotification] No users to notify");
    return results;
  }

  console.log(`[BulkNotification] Sending to ${users.length} users`);

  // Process in batches
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(users.length / batchSize);

    try {
      // Send notifications in parallel within batch
      const batchResults = await Promise.all(
        batch.map((user) =>
          sendNotificationToUser({
            fid: user.fid,
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

      console.log(
        `[BulkNotification] Batch ${batchNumber}/${totalBatches} complete:`,
        {
          success: batchResults.filter((r) => r.state === "success").length,
          failed: batchResults.filter((r) => r.state !== "success").length,
        }
      );
    } catch (batchError) {
      console.error(`[BulkNotification] Batch ${batchNumber} failed:`, {
        error: batchError instanceof Error ? batchError.message : batchError,
      });
      results.failed += batch.length;
    }

    // Delay between batches to avoid rate limits
    if (i + batchSize < users.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  console.log(`[BulkNotification] Complete:`, results);
  return results;
}
