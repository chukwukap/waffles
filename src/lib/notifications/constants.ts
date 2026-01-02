// Timeouts
export const FETCH_TIMEOUT_MS = 10_000;
export const WEBHOOK_TARGET_RESPONSE_MS = 100; // Baseapp needs < 10s, aim for 100ms

// Batching
export const MAX_TOKENS_PER_REQUEST = 100; // Farcaster spec limit
export const BATCH_DELAY_MS = 1_000; // Delay between batches

// Rate limits (per Farcaster spec)
export const RATE_LIMIT_PER_TOKEN_SECONDS = 30;
export const RATE_LIMIT_PER_TOKEN_DAILY = 100;

// Retries
export const MAX_RETRIES = 3;
export const RETRY_BASE_DELAY_MS = 1_000;

// Logging prefix
export const LOG_PREFIX = "[Notifications]";
