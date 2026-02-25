import {
  SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/miniapp-node";
import { prisma } from "@/lib/db";
import { getUsersWithTokens, deleteInvalidToken } from "./tokens";
import {
  FETCH_TIMEOUT_MS,
  MAX_TOKENS_PER_REQUEST,
  BATCH_DELAY_MS,
  LOG_PREFIX,
} from "./constants";
import type {
  BatchResult,
  NotificationPayload,
  UserFilter,
  TokenGroup,
  UserWithTokens,
} from "./types";

/**
 * Target for batch notifications - either a filter or specific FIDs
 */
export type BatchTarget = UserFilter | { fids: number[] };

/**
 * Send notifications with TRUE batching
 * Groups tokens by URL, sends up to 100 per request
 *
 * @param payload - Notification content (title, body, targetUrl)
 * @param target - Either a filter ("all", "active") or { fids: number[] }
 *
 * @example
 * // Send to all active users
 * await sendBatch({ title: "...", body: "...", targetUrl: "..." }, "active");
 *
 * // Send to specific game participants
 * await sendBatch({ title: "...", body: "...", targetUrl: "..." }, { fids: [123, 456, 789] });
 */
export async function sendBatch(
  payload: NotificationPayload,
  target: BatchTarget = "all",
): Promise<BatchResult> {
  const startTime = Date.now();

  // Get users based on target type
  let users: UserWithTokens[];

  if (typeof target === "string") {
    // Filter-based targeting
    users = await getUsersWithTokens(target);
  } else {
    // FID-based targeting
    if (target.fids.length === 0) {
      return {
        total: 0,
        success: 0,
        failed: 0,
        invalidTokens: 0,
        rateLimited: 0,
        durationMs: Date.now() - startTime,
      };
    }

    users = await prisma.user.findMany({
      where: {
        fid: { in: target.fids },
        notifs: { some: {} },
      },
      select: {
        fid: true,
        username: true,
        notifs: {
          select: { id: true, appFid: true, token: true, url: true },
        },
      },
    });
  }

  if (users.length === 0) {
    return {
      total: 0,
      success: 0,
      failed: 0,
      invalidTokens: 0,
      rateLimited: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // Group tokens by notification URL
  const tokenGroups = groupTokensByUrl(users);

  console.log(
    `${LOG_PREFIX} Batch send: ${users.length} users, ${tokenGroups.length} URL groups`,
  );

  // Process each URL group
  const results: BatchResult = {
    total: users.length,
    success: 0,
    failed: 0,
    invalidTokens: 0,
    rateLimited: 0,
    durationMs: 0,
  };

  // Use stable notificationId for deduplication
  const notificationId = payload.notificationId ?? `batch-${Date.now()}`;

  for (const group of tokenGroups) {
    // Split into batches of 100
    for (let i = 0; i < group.tokens.length; i += MAX_TOKENS_PER_REQUEST) {
      const batch = group.tokens.slice(i, i + MAX_TOKENS_PER_REQUEST);

      const batchResult = await sendBatchToUrl(group.url, batch, {
        ...payload,
        notificationId,
      });

      results.success += batchResult.success;
      results.failed += batchResult.failed;
      results.invalidTokens += batchResult.invalidTokens;
      results.rateLimited += batchResult.rateLimited;

      // Delay between batches
      if (i + MAX_TOKENS_PER_REQUEST < group.tokens.length) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }
  }

  results.durationMs = Date.now() - startTime;

  console.log(`${LOG_PREFIX} Batch complete:`, {
    ...results,
    requestCount: Math.ceil(
      tokenGroups.reduce((sum, g) => sum + g.tokens.length, 0) /
        MAX_TOKENS_PER_REQUEST,
    ),
  });

  return results;
}

/**
 * Send a batch to a single URL
 */
async function sendBatchToUrl(
  url: string,
  batch: TokenGroup["tokens"],
  payload: NotificationPayload & { notificationId: string },
): Promise<{
  success: number;
  failed: number;
  invalidTokens: number;
  rateLimited: number;
}> {
  const result = { success: 0, failed: 0, invalidTokens: 0, rateLimited: 0 };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notificationId: payload.notificationId,
        title: payload.title,
        body: payload.body,
        targetUrl: payload.targetUrl,
        tokens: batch.map((t) => t.token),
      } satisfies SendNotificationRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status !== 200) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch {}
      console.error(
        `${LOG_PREFIX} Batch failed: url=${url}, status=${response.status}, body=${errorBody}`,
      );
      result.failed = batch.length;
      return result;
    }

    const data = await response.json();
    const parsed = sendNotificationResponseSchema.safeParse(data);

    if (!parsed.success) {
      result.failed = batch.length;
      return result;
    }

    const { invalidTokens, rateLimitedTokens } = parsed.data.result;

    // Calculate success count
    result.success =
      batch.length - invalidTokens.length - rateLimitedTokens.length;
    result.invalidTokens = invalidTokens.length;
    result.rateLimited = rateLimitedTokens.length;

    // Clean up invalid tokens (fire-and-forget)
    for (const invalidToken of invalidTokens) {
      deleteInvalidToken(invalidToken).catch(() => {});
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} Batch request failed:`, { url, error });
    result.failed = batch.length;
  }

  return result;
}

/**
 * Group tokens by their notification URL
 * This is the key optimization - same URL = same batch
 */
function groupTokensByUrl(users: UserWithTokens[]): TokenGroup[] {
  const map = new Map<string, TokenGroup["tokens"]>();

  for (const user of users) {
    for (const notif of user.notifs) {
      const existing = map.get(notif.url) ?? [];
      existing.push({
        token: notif.token,
        fid: user.fid,
        appFid: notif.appFid,
        userId: notif.id,
      });
      map.set(notif.url, existing);
    }
  }

  return Array.from(map.entries()).map(([url, tokens]) => ({ url, tokens }));
}
