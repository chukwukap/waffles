/**
 * OG Image URL Builders
 *
 * Builds URLs for the @vercel/og API routes that generate dynamic OG images.
 * These replace the old Cloudinary URL-based approach.
 */

import { env } from "./env";

// ==========================================
// TYPES
// ==========================================

export interface JoinedOGParams {
  username: string;
  pfpUrl?: string;
  prizePool: number;
  theme: string;
  themeImageUrl: string; // Required
  othersCount?: number;
}

export interface PrizeOGParams {
  prizeAmount: number;
  pfpUrl?: string;
}

export interface ScoreOGParams {
  score: number;
  username: string;
  gameNumber: number;
  category: string;
  rank?: number;
  pfpUrl?: string;
}

// ==========================================
// URL BUILDERS
// ==========================================

/**
 * Build URL for Joined Game OG image
 */
export function buildJoinedOGUrl(params: JoinedOGParams): string {
  const baseUrl = env.rootUrl || "";
  if (!baseUrl) return "";

  const searchParams = new URLSearchParams();
  searchParams.set("username", params.username);
  searchParams.set("prizePool", params.prizePool.toString());
  searchParams.set("theme", params.theme);
  if (params.pfpUrl) {
    searchParams.set("pfpUrl", params.pfpUrl);
  }
  searchParams.set("themeImageUrl", params.themeImageUrl);
  if (params.othersCount) {
    searchParams.set("othersCount", params.othersCount.toString());
  }

  return `${baseUrl}/api/og/joined?${searchParams.toString()}`;
}

/**
 * Build URL for Prize Won OG image
 */
export function buildPrizeOGUrl(params: PrizeOGParams): string {
  const baseUrl = env.rootUrl || "";
  if (!baseUrl) return "";

  const searchParams = new URLSearchParams();
  searchParams.set("prizeAmount", params.prizeAmount.toString());
  if (params.pfpUrl) {
    searchParams.set("pfpUrl", params.pfpUrl);
  }

  return `${baseUrl}/api/og/prize?${searchParams.toString()}`;
}

/**
 * Build URL for Score Share OG image
 */
export function buildScoreOGUrl(params: ScoreOGParams): string {
  const baseUrl = env.rootUrl || "";
  if (!baseUrl) return "";

  const searchParams = new URLSearchParams();
  searchParams.set("score", params.score.toString());
  searchParams.set("username", params.username);
  searchParams.set("gameNumber", params.gameNumber.toString());
  searchParams.set("category", params.category);
  if (params.rank !== undefined) {
    searchParams.set("rank", params.rank.toString());
  }
  if (params.pfpUrl) {
    searchParams.set("pfpUrl", params.pfpUrl);
  }

  return `${baseUrl}/api/og/score?${searchParams.toString()}`;
}

/**
 * Check if OG image generation is configured
 */
export function isOGConfigured(): boolean {
  return Boolean(env.rootUrl);
}
