/**
 * Cloudinary OG Image Generation
 *
 * High-quality dynamic Open Graph images using Cloudinary URL transformations.
 * No API routes needed - just construct the URL and use it directly in metadata.
 */

import { env } from "./env";

// ==========================================
// CONFIGURATION
// ==========================================

// Base template path in Cloudinary (1200x630 dark background)
const BASE_TEMPLATE = "og-base-template_vchiru";

// ==========================================
// TYPES
// ==========================================

export interface JoinedOGParams {
  username: string;
  pfpUrl?: string;
  prizePool: number;
  theme: string;
  othersCount?: number;
}

export interface PrizeOGParams {
  username: string;
  pfpUrl?: string;
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
 * Encode URL to standard base64 for Cloudinary fetch overlay
 * Cloudinary requires standard base64 (not base64url)
 */
function toBase64(url: string): string {
  return Buffer.from(url).toString("base64");
}

/**
 * Build "Joined Game" OG image URL
 * Shows: username, pfp, prize pool, theme
 */
export function buildJoinedOGUrl(params: JoinedOGParams): string {
  const cloudName = getCloudName();
  if (!cloudName) return "";

  const { username, pfpUrl, prizePool, theme, othersCount } = params;

  // Build transformation string
  const transforms: string[] = [];

  // Profile picture (circular, left side)
  // Syntax: l_fetch:<base64>/c_fill,w_80,h_80,r_max/fl_layer_apply,g_north_west,x_100,y_150
  if (pfpUrl) {
    const b64 = toBase64(pfpUrl);
    transforms.push(
      `l_fetch:${b64}/c_fill,w_80,h_80,r_max/fl_layer_apply,g_north_west,x_100,y_150`
    );
  }

  // Username (offset to right if pfp exists)
  const usernameX = pfpUrl ? 200 : 100;
  transforms.push(
    `l_text:Roboto%20Mono_42_bold:${encodeText(
      username.toUpperCase().slice(0, 16)
    )},co_rgb:${COLORS.white},g_north_west,x_${usernameX},y_160`
  );

  // "has joined the next game"
  transforms.push(
    `l_text:Roboto_24:has%20joined%20the%20next%20game,co_rgb:${COLORS.gray},g_north_west,x_${usernameX},y_215`
  );

  // Prize pool
  transforms.push(
    `l_text:Roboto_18:Prize%20pool,co_rgb:${COLORS.gray},g_south_west,x_150,y_180`
  );
  transforms.push(
    `l_text:Roboto%20Mono_36_bold:${encodeText(
      `$${prizePool.toLocaleString()}`
    )},co_rgb:${COLORS.gold},g_south_west,x_150,y_130`
  );

  // Theme
  transforms.push(
    `l_text:Roboto_18:Theme,co_rgb:${COLORS.gray},g_south_west,x_400,y_180`
  );
  transforms.push(
    `l_text:Roboto%20Mono_36_bold:${encodeText(theme.toUpperCase())},co_rgb:${
      COLORS.white
    },g_south_west,x_400,y_130`
  );

  // Others count (optional)
  if (othersCount && othersCount > 0) {
    transforms.push(
      `l_text:Roboto_18:${encodeText(`+${othersCount} others`)},co_rgb:${
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
 * Shows: pfp, username, rank, prize amount
 */
export function buildPrizeOGUrl(params: PrizeOGParams): string {
  const cloudName = getCloudName();
  if (!cloudName) return "";

  const { username, pfpUrl, rank, prizeAmount } = params;

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

  // Profile picture (centered, top)
  if (pfpUrl) {
    const b64 = toBase64(pfpUrl);
    transforms.push(
      `l_fetch:${b64}/c_fill,w_100,h_100,r_max/fl_layer_apply,g_north,y_80`
    );
  }

  // Username (below pfp)
  const usernameY = pfpUrl ? 200 : 120;
  transforms.push(
    `l_text:Roboto%20Mono_32_bold:${encodeText(
      username.toUpperCase().slice(0, 16)
    )},co_rgb:${COLORS.white},g_north,y_${usernameY}`
  );

  // "JUST WON"
  transforms.push(
    `l_text:Roboto%20Mono_28:JUST%20WON,co_rgb:${COLORS.white},g_center,y_-40`
  );

  // Prize amount (large, green)
  transforms.push(
    `l_text:Roboto%20Mono_72_bold:${encodeText(
      `$${prizeAmount.toLocaleString()}`
    )},co_rgb:${COLORS.green},g_center,y_30`
  );

  // "ON WAFFLES"
  transforms.push(
    `l_text:Roboto%20Mono_28:ON%20WAFFLES,co_rgb:${COLORS.white},g_center,y_100`
  );

  // Rank badge
  transforms.push(
    `l_text:Roboto%20Mono_24_bold:${encodeText(
      rankText
    )},co_rgb:${rankColor},g_south,y_80`
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
