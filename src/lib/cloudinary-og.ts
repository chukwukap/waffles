/**
 * Cloudinary OG Image Generation
 *
 * High-quality dynamic Open Graph images using Cloudinary URL transformations.
 * No API routes needed - just construct the URL and use it directly in metadata.
 *
 * SETUP REQUIRED:
 * 1. Upload a base template image (1200x630, dark background) to Cloudinary
 * 2. Place it at: waffles/og-templates/base
 * 3. Update CLOUD_NAME below with your Cloudinary cloud name
 */

import { env } from "./env";

// ==========================================
// CONFIGURATION
// ==========================================

// Base template path in Cloudinary (upload a 1200x630 dark PNG here)
const BASE_TEMPLATE = "waffles/og-templates/base";

// ==========================================
// TYPES
// ==========================================

export interface JoinedOGParams {
  username: string;
  prizePool: number;
  theme: string;
  othersCount?: number;
}

export interface PrizeOGParams {
  username: string;
  rank: number;
  prizeAmount: number;
}

export interface WaitlistOGParams {
  rank: number;
}

// ==========================================
// COLORS (without # prefix for Cloudinary)
// ==========================================

const COLORS = {
  white: "FFFFFF",
  gold: "FFC931",
  gray: "99A0AE",
  green: "05FF8F",
} as const;

// ==========================================
// URL BUILDERS
// ==========================================

/**
 * Get the Cloudinary cloud name from env
 */
function getCloudName(): string {
  return env.cloudinaryCloudName || "";
}

/**
 * Encode text for Cloudinary URL (URL-safe)
 */
function encodeText(text: string): string {
  return encodeURIComponent(text)
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

/**
 * Build "Joined Game" OG image URL
 * Shows: username, prize pool, theme
 */
export function buildJoinedOGUrl(params: JoinedOGParams): string {
  const cloudName = getCloudName();
  if (!cloudName) return "";

  const { username, prizePool, theme, othersCount } = params;

  // Build transformation string
  const transforms: string[] = [];

  // Username (centered, top)
  transforms.push(
    `l_text:Roboto%20Mono_48_bold:${encodeText(
      username.toUpperCase().slice(0, 16)
    )},co_rgb:${COLORS.white},g_north,y_160`
  );

  // "has joined the next game"
  transforms.push(
    `l_text:Roboto_28:has%20joined%20the%20next%20game,co_rgb:${COLORS.gray},g_north,y_230`
  );

  // Prize pool
  transforms.push(
    `l_text:Roboto_20:Prize%20pool,co_rgb:${COLORS.gray},g_south_west,x_150,y_180`
  );
  transforms.push(
    `l_text:Roboto%20Mono_40_bold:${encodeText(
      `$${prizePool.toLocaleString()}`
    )},co_rgb:${COLORS.gold},g_south_west,x_150,y_120`
  );

  // Theme
  transforms.push(
    `l_text:Roboto_20:Theme,co_rgb:${COLORS.gray},g_south_west,x_450,y_180`
  );
  transforms.push(
    `l_text:Roboto%20Mono_40_bold:${encodeText(theme.toUpperCase())},co_rgb:${
      COLORS.white
    },g_south_west,x_450,y_120`
  );

  // Others count (optional)
  if (othersCount && othersCount > 0) {
    transforms.push(
      `l_text:Roboto_20:${encodeText(`+${othersCount} others`)},co_rgb:${
        COLORS.gray
      },g_north_east,x_150,y_180`
    );
  }

  // WAFFLES branding
  transforms.push(
    `l_text:Roboto%20Mono_24_bold:WAFFLES,co_rgb:${COLORS.gold},g_south,y_40`
  );

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(
    "/"
  )}/${BASE_TEMPLATE}`;
}

/**
 * Build "Prize Won" OG image URL
 * Shows: username, rank, prize amount
 */
export function buildPrizeOGUrl(params: PrizeOGParams): string {
  const cloudName = getCloudName();
  if (!cloudName) return "";

  const { username, rank, prizeAmount } = params;

  // Rank display text and color
  const rankText =
    rank === 1
      ? "1ST PLACE"
      : rank === 2
      ? "2ND PLACE"
      : rank === 3
      ? "3RD PLACE"
      : `#${rank}`;
  const rankColor = rank === 1 ? COLORS.gold : COLORS.white;

  const transforms: string[] = [];

  // Username
  transforms.push(
    `l_text:Roboto%20Mono_36_bold:${encodeText(
      username.toUpperCase().slice(0, 16)
    )},co_rgb:${COLORS.white},g_north,y_180`
  );

  // "JUST WON"
  transforms.push(
    `l_text:Roboto%20Mono_32:JUST%20WON,co_rgb:${COLORS.white},g_center,y_-60`
  );

  // Prize amount (large, green)
  transforms.push(
    `l_text:Roboto%20Mono_80_bold:${encodeText(
      `$${prizeAmount.toLocaleString()}`
    )},co_rgb:${COLORS.green},g_center,y_20`
  );

  // "ON WAFFLES"
  transforms.push(
    `l_text:Roboto%20Mono_32:ON%20WAFFLES,co_rgb:${COLORS.white},g_center,y_100`
  );

  // Rank badge
  transforms.push(
    `l_text:Roboto%20Mono_28_bold:${encodeText(
      rankText
    )},co_rgb:${rankColor},g_south,y_100`
  );

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(
    "/"
  )}/${BASE_TEMPLATE}`;
}

/**
 * Build "Waitlist" OG image URL
 * Shows: rank position
 */
export function buildWaitlistOGUrl(params: WaitlistOGParams): string {
  const cloudName = getCloudName();
  if (!cloudName) return "";

  const { rank } = params;

  const transforms: string[] = [];

  // "I'M" text
  transforms.push(
    `l_text:Roboto%20Mono_36:I%27M,co_rgb:${COLORS.white},g_center,y_-80`
  );

  // Rank number (large, gold)
  transforms.push(
    `l_text:Roboto%20Mono_120_bold:${encodeText(`#${rank}`)},co_rgb:${
      COLORS.gold
    },g_center,y_20`
  );

  // "ON THE WAITLIST"
  transforms.push(
    `l_text:Roboto%20Mono_36:ON%20THE%20WAITLIST,co_rgb:${COLORS.white},g_center,y_120`
  );

  // WAFFLES branding
  transforms.push(
    `l_text:Roboto%20Mono_24_bold:WAFFLES,co_rgb:${COLORS.gold},g_south,y_60`
  );

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(
    "/"
  )}/${BASE_TEMPLATE}`;
}

/**
 * Check if Cloudinary OG is configured
 */
export function isCloudinaryOGConfigured(): boolean {
  return Boolean(getCloudName());
}
