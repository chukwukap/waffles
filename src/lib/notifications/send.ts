import {
  SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/miniapp-node";
import { getTokensForUser, deleteToken } from "./tokens";
import {
  FETCH_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_BASE_DELAY_MS,
  LOG_PREFIX,
} from "./constants";
import type { SendResult, NotificationPayload } from "./types";

/**
 * Send notification to a single user
 * Tries all their tokens until one succeeds
 */
export async function sendToUser(
  fid: number,
  payload: NotificationPayload
): Promise<SendResult> {
  const tokens = await getTokensForUser(fid);

  if (tokens.length === 0) {
    return { state: "no_token" };
  }

  const notificationId = payload.notificationId ?? crypto.randomUUID();

  for (const token of tokens) {
    const result = await sendToToken({
      url: token.url,
      tokenString: token.token,
      appFid: token.appFid,
      fid,
      payload: { ...payload, notificationId },
    });

    if (result.state === "success") {
      return result;
    }

    // If invalid token, continue to next
    if (result.state === "invalid_token") {
      await deleteToken(fid, token.appFid);
      continue;
    }
  }

  return { state: "error", error: "All tokens failed" };
}

/**
 * Send to a single token with retry logic
 */
async function sendToToken({
  url,
  tokenString,
  appFid,
  fid,
  payload,
}: {
  url: string;
  tokenString: string;
  appFid: number;
  fid: number;
  payload: NotificationPayload & { notificationId: string };
}): Promise<SendResult> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Exponential backoff (skip on first attempt)
    if (attempt > 0) {
      const delay = Math.pow(2, attempt - 1) * RETRY_BASE_DELAY_MS;
      await new Promise((r) => setTimeout(r, delay));
    }

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
          tokens: [tokenString],
        } satisfies SendNotificationRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status !== 200) {
        console.error(`${LOG_PREFIX} API error: status=${response.status}`, {
          fid,
        });
        return { state: "error", error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      const parsed = sendNotificationResponseSchema.safeParse(data);

      if (!parsed.success) {
        return { state: "error", error: parsed.error };
      }

      const result = parsed.data.result;

      // Check for invalid token
      if (result.invalidTokens.includes(tokenString)) {
        console.log(
          `${LOG_PREFIX} Invalid token detected: fid=${fid}, appFid=${appFid}`
        );
        return { state: "invalid_token" };
      }

      // Check for rate limit
      if (result.rateLimitedTokens.includes(tokenString)) {
        if (attempt < MAX_RETRIES) {
          continue; // Retry with backoff
        }
        return { state: "rate_limit" };
      }

      return { state: "success" };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error(`${LOG_PREFIX} Timeout: fid=${fid}`);
      }
      if (attempt === MAX_RETRIES) {
        return { state: "error", error };
      }
    }
  }

  return { state: "error", error: "Max retries exceeded" };
}
