/**
 * Cloudinary OG Image Generation
 *
 * High-quality dynamic Open Graph images using Cloudinary transformations.
 * Works WITHOUT pre-uploaded templates by using Cloudinary's base transformations.
 */

import { env } from "./env";

// ==========================================
// TYPES
// ==========================================

export type OGTemplateType = "joined" | "prize" | "game";

export interface JoinedOGParams {
  template: "joined";
  username: string;
  pfpUrl?: string;
  prizePool: number;
  theme: string;
  themeIconUrl?: string;
  othersCount?: number;
}

export interface PrizeOGParams {
  template: "prize";
  username: string;
  pfpUrl?: string;
  rank: number;
  prizeAmount: number;
}

export interface GameOGParams {
  template: "game";
  title: string;
  theme: string;
  prizePool: number;
  playerCount: number;
  coverUrl?: string;
}

export type OGImageParams = JoinedOGParams | PrizeOGParams | GameOGParams;

// ==========================================
// FONT CONFIG (Google Fonts available in Cloudinary)
// ==========================================

const FONTS = {
  display: "Roboto%20Mono", // URL-encoded
  body: "Roboto",
} as const;

// ==========================================
// COLORS
// ==========================================

const COLORS = {
  white: "FFFFFF",
  gold: "FFC931",
  gray: "99A0AE",
  green: "05FF8F",
  darkBg: "0F0F15",
  cardBg: "1E1E1E",
} as const;

// ==========================================
// BUILD DYNAMIC OG IMAGE URL
// ==========================================

/**
 * Build a Cloudinary URL for a dynamic OG image
 * Uses text overlays and image fetching for dynamic content
 * Works WITHOUT pre-uploaded templates
 */
export function buildOGImageUrl(params: OGImageParams): string {
  const cloudName = env.cloudinaryCloudName;

  if (!cloudName) {
    console.error("[OG] Cloudinary not configured");
    return "";
  }

  switch (params.template) {
    case "joined":
      return buildJoinedOGUrl(cloudName, params);
    case "prize":
      return buildPrizeOGUrl(cloudName, params);
    case "game":
      return buildGameOGUrl(cloudName, params);
    default:
      return "";
  }
}

// ==========================================
// JOINED TEMPLATE
// "Username has joined the next game"
// ==========================================

function buildJoinedOGUrl(cloudName: string, params: JoinedOGParams): string {
  // Build transformation URL with solid background
  const t: string[] = [];

  // Start with solid background (create from nothing using a 1px placeholder)
  // We use a sample image and overlay everything
  t.push("w_1200,h_630,c_fill,b_rgb:0F0F15");

  // Card outline (gold border simulation using a rectangle overlay)
  // Since we can't draw borders easily, we use layered rectangles
  t.push(
    "co_rgb:FFC931,e_colorize:100/w_1000,h_400,c_pad,b_transparent,r_32,bo_4px_solid_FFC931"
  );

  // Username (large, white, top left of card)
  const safeUsername = encodeText(params.username.toUpperCase().slice(0, 16));
  t.push(
    `l_text:${FONTS.display}_42_bold:${safeUsername},co_rgb:${COLORS.white},g_north_west,x_180,y_180`
  );

  // "has joined the next game" subtitle
  t.push(
    `l_text:${FONTS.body}_24:has%20joined%20the%20next%20game,co_rgb:${COLORS.gray},g_north_west,x_180,y_240`
  );

  // Prize pool label
  t.push(
    `l_text:${FONTS.body}_18:Prize%20pool,co_rgb:${COLORS.gray},g_south_west,x_180,y_180`
  );

  // Prize pool amount
  const prizeText = encodeText(`$${params.prizePool.toLocaleString()}`);
  t.push(
    `l_text:${FONTS.display}_36_bold:${prizeText},co_rgb:${COLORS.white},g_south_west,x_180,y_130`
  );

  // Theme label
  t.push(
    `l_text:${FONTS.body}_18:Theme,co_rgb:${COLORS.gray},g_south_west,x_420,y_180`
  );

  // Theme name
  const themeText = encodeText(params.theme.toUpperCase());
  t.push(
    `l_text:${FONTS.display}_36_bold:${themeText},co_rgb:${COLORS.white},g_south_west,x_420,y_130`
  );

  // Others count (if any)
  if (params.othersCount && params.othersCount > 0) {
    const othersText = encodeText(`+${params.othersCount} others`);
    t.push(
      `l_text:${FONTS.body}_18:${othersText},co_rgb:${COLORS.white},g_north_east,x_180,y_180`
    );
  }

  // Profile picture overlay (circular, fetched from URL)
  if (params.pfpUrl) {
    // Use fetch overlay with circular crop
    const b64Url = toBase64Url(params.pfpUrl);
    t.push(
      `l_fetch:${b64Url}/c_fill,w_90,h_90,r_max/fl_layer_apply,g_north_west,x_70,y_170`
    );
  }

  // Use a 1x1 transparent pixel as base and apply all transformations
  return `https://res.cloudinary.com/${cloudName}/image/upload/${t.join(
    "/"
  )}/sample.png`;
}

// ==========================================
// PRIZE TEMPLATE
// "Just won $X on Waffles"
// ==========================================

function buildPrizeOGUrl(cloudName: string, params: PrizeOGParams): string {
  const t: string[] = [];

  // Start with gradient-like background (dark)
  t.push("w_1200,h_630,c_fill,b_rgb:0F0F15");

  // Profile picture (centered, top)
  if (params.pfpUrl) {
    const b64Url = toBase64Url(params.pfpUrl);
    t.push(
      `l_fetch:${b64Url}/c_fill,w_120,h_120,r_max/fl_layer_apply,g_north,y_100`
    );
  }

  // Username
  const safeUsername = encodeText(params.username.toUpperCase().slice(0, 16));
  t.push(
    `l_text:${FONTS.display}_32_bold:${safeUsername},co_rgb:${COLORS.white},g_north,y_240`
  );

  // "JUST WON" text
  t.push(
    `l_text:${FONTS.display}_28:JUST%20WON,co_rgb:${COLORS.white},g_center,y_-40`
  );

  // Prize amount (large, green)
  const prizeText = encodeText(`$${params.prizeAmount.toLocaleString()}`);
  t.push(
    `l_text:${FONTS.display}_72_bold:${prizeText},co_rgb:${COLORS.green},g_center,y_30`
  );

  // "ON WAFFLES" text
  t.push(
    `l_text:${FONTS.display}_28:ON%20WAFFLES,co_rgb:${COLORS.white},g_center,y_100`
  );

  // Rank badge
  const rankTextMap: Record<number, string> = {
    1: "🥇 1ST PLACE",
    2: "🥈 2ND PLACE",
    3: "🥉 3RD PLACE",
  };
  const rankDisplay = rankTextMap[params.rank] || `#${params.rank}`;
  const rankColor = params.rank === 1 ? COLORS.gold : COLORS.white;
  t.push(
    `l_text:${FONTS.display}_24_bold:${encodeText(
      rankDisplay
    )},co_rgb:${rankColor},g_south,y_120`
  );

  return `https://res.cloudinary.com/${cloudName}/image/upload/${t.join(
    "/"
  )}/sample.png`;
}

// ==========================================
// GAME TEMPLATE
// Game promotion card
// ==========================================

function buildGameOGUrl(cloudName: string, params: GameOGParams): string {
  const t: string[] = [];

  // Dark background
  t.push("w_1200,h_630,c_fill,b_rgb:0F0F15");

  // Game title (large, centered)
  const safeTitle = encodeText(params.title.toUpperCase().slice(0, 25));
  t.push(
    `l_text:${FONTS.display}_48_bold:${safeTitle},co_rgb:${COLORS.white},g_center,y_-80`
  );

  // Theme badge
  const themeText = encodeText(`${params.theme.toUpperCase()} TRIVIA`);
  t.push(
    `l_text:${FONTS.body}_24:${themeText},co_rgb:${COLORS.gray},g_center,y_-20`
  );

  // Prize pool (gold, prominent)
  const prizeText = encodeText(
    `$${params.prizePool.toLocaleString()} PRIZE POOL`
  );
  t.push(
    `l_text:${FONTS.display}_42_bold:${prizeText},co_rgb:${COLORS.gold},g_center,y_60`
  );

  // Player count
  const playersText = encodeText(`${params.playerCount} players joined`);
  t.push(
    `l_text:${FONTS.body}_20:${playersText},co_rgb:${COLORS.gray},g_center,y_130`
  );

  // WAFFLES branding at bottom
  t.push(
    `l_text:${FONTS.display}_24_bold:WAFFLES,co_rgb:${COLORS.gold},g_south,y_60`
  );

  return `https://res.cloudinary.com/${cloudName}/image/upload/${t.join(
    "/"
  )}/sample.png`;
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Encode text for Cloudinary URL (URL-safe)
 */
function encodeText(text: string): string {
  return encodeURIComponent(text).replace(/%20/g, "%20");
}

/**
 * Convert URL to base64url for Cloudinary fetch
 */
function toBase64Url(url: string): string {
  return Buffer.from(url).toString("base64url");
}

// ==========================================
// FETCH IMAGE (for API routes that proxy)
// ==========================================

/**
 * Fetch the generated OG image and return as Response
 * Use this in API routes that need to serve the image directly
 */
export async function fetchOGImage(params: OGImageParams): Promise<Response> {
  const url = buildOGImageUrl(params);

  if (!url) {
    return new Response("Failed to generate OG image URL", { status: 500 });
  }

  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.error(
        "[OG] Cloudinary fetch error:",
        res.status,
        await res.text()
      );
      return new Response("Failed to fetch OG image", { status: 500 });
    }

    return new Response(res.body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch (error) {
    console.error("[OG] Fetch error:", error);
    return new Response("Failed to fetch OG image", { status: 500 });
  }
}

// ==========================================
// REDIRECT HELPER
// ==========================================

/**
 * Redirect to the Cloudinary OG image URL
 * Fastest option - no proxy overhead
 */
export function redirectToOGImage(params: OGImageParams): Response {
  const url = buildOGImageUrl(params);

  if (!url) {
    return new Response("Failed to generate OG image URL", { status: 500 });
  }

  return Response.redirect(url, 302);
}
