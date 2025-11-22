import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters for different actions
export const waitlistRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 requests per hour
  analytics: true,
  prefix: "ratelimit:waitlist",
});

export const inviteRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 requests per hour
  analytics: true,
  prefix: "ratelimit:invite",
});

export const generalRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute
  analytics: true,
  prefix: "ratelimit:general",
});

/**
 * Check rate limit for a given identifier
 * Returns { success: boolean, limit: number, remaining: number, reset: Date }
 */
export async function checkRateLimit(limiter: Ratelimit, identifier: string) {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === "development") {
    return { success: true, limit: 999, remaining: 999, reset: new Date() };
  }

  // Skip if Redis is not configured
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    console.warn("Redis not configured, skipping rate limit");
    return { success: true, limit: 0, remaining: 0, reset: new Date() };
  }

  try {
    const result = await limiter.limit(identifier);
    return result;
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail open - allow request if rate limiting fails
    return { success: true, limit: 0, remaining: 0, reset: new Date() };
  }
}
