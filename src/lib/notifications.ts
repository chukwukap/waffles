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
 * Delete user notification details
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
 * Get user notification details
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
 * Send a notification to a user with retry logic for rate limits
 */
export async function sendMiniAppNotification({
  fid,
  appFid,
  title,
  body,
  targetUrl,
  maxRetries = DEFAULT_MAX_RETRIES,
}: {
  fid: number;
  appFid: number;
  title: string;
  body: string;
  targetUrl: string;
  maxRetries?: number;
}): Promise<SendMiniAppNotificationResult> {
  // Validate inputs
  if (!fid || !appFid || !title || !body || !targetUrl) {
    console.error("[Notification] Invalid input:", {
      fid,
      appFid,
      hasTitle: !!title,
      hasBody: !!body,
      hasTargetUrl: !!targetUrl,
    });
    return { state: "error", error: "Invalid notification parameters" };
  }

  const notificationDetails = await getUserNotificationDetails(fid, appFid);

  if (!notificationDetails) {
    console.log(`[Notification] No token for fid ${fid}, appFid ${appFid}`);
    return { state: "no_token" };
  }

  // Validate token data
  if (!notificationDetails.url || !notificationDetails.token) {
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
        notificationDetails.url,
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
            tokens: [notificationDetails.token],
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
          // Malformed response
          console.error("[Notification] Malformed response:", {
            fid,
            errors: responseBody.error.errors,
          });
          return { state: "error", error: responseBody.error.errors };
        }

        if (responseBody.data.result.rateLimitedTokens.length) {
          // Rate limited - retry if attempts remaining
          lastResult = { state: "rate_limit" };
          continue;
        }

        // Handle invalid tokens if necessary (e.g., delete them)
        if (responseBody.data.result.invalidTokens.length) {
          console.log(`[Notification] Removing invalid token for fid ${fid}`);
          await deleteUserNotificationDetails(fid, appFid);
        }

        return { state: "success" };
      } else {
        // Error response
        console.error("[Notification] API error response:", {
          fid,
          status: response.status,
          response: responseJson,
        });
        return { state: "error", error: responseJson };
      }
    } catch (error) {
      // Check for abort (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        console.error("[Notification] Request timeout:", {
          fid,
          appFid,
          url: notificationDetails.url,
        });
        return { state: "error", error: "Request timeout" };
      }

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

// ============================================================================
// USER QUERIES
// ============================================================================

/**
 * Get count of users with notification tokens
 */
export async function getNotificationEnabledUserCount(
  filter?: "all" | "active" | "waitlist"
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
    }

    return await prisma.user.count({ where });
  } catch (error) {
    console.error("[Notification] Failed to count users:", {
      filter,
      error: error instanceof Error ? error.message : error,
    });
    return 0; // Return 0 on error instead of throwing
  }
}

/**
 * Get all users with notification tokens based on filter
 */
export async function getUsersWithNotifications(
  filter?: "all" | "active" | "waitlist"
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
    }

    return await prisma.user.findMany({
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
  } catch (error) {
    console.error("[Notification] Failed to get users:", {
      filter,
      error: error instanceof Error ? error.message : error,
    });
    return []; // Return empty array on error instead of throwing
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
  appFid,
  filter = "all",
  batchSize = DEFAULT_BATCH_SIZE,
  delayBetweenBatches = DEFAULT_BATCH_DELAY_MS,
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
  // Validate inputs
  if (!title || !body || !targetUrl || !appFid) {
    console.error("[BulkNotification] Invalid input:", {
      hasTitle: !!title,
      hasBody: !!body,
      hasTargetUrl: !!targetUrl,
      appFid,
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

      console.log(
        `[BulkNotification] Batch ${batchNumber}/${totalBatches} complete:`,
        {
          success: batchResults.filter((r) => r.state === "success").length,
          failed: batchResults.filter((r) => r.state !== "success").length,
        }
      );
    } catch (batchError) {
      // If entire batch fails (shouldn't happen with Promise.all + individual catches)
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
