/**
 * OG Image Font Loader
 * Loads custom fonts for @vercel/og ImageResponse
 */

// Font paths relative to this file
const FONT_PATHS = {
  editUndo: "../../../lib/fonts/editundo_bd.ttf",
  brockmann: "../../../lib/fonts/brockmann_bd.otf",
} as const;

// Cached font data
let cachedEditUndo: ArrayBuffer | null = null;
let cachedBrockmann: ArrayBuffer | null = null;

/**
 * Load Edit Undo BRK font (pixel style for values)
 */
export async function loadEditUndoFont(): Promise<ArrayBuffer> {
  if (cachedEditUndo) return cachedEditUndo;

  const fontData = await fetch(
    new URL(FONT_PATHS.editUndo, import.meta.url),
  ).then((res) => res.arrayBuffer());

  cachedEditUndo = fontData;
  return fontData;
}

/**
 * Load Brockmann font (labels/body text)
 */
export async function loadBrockmannFont(): Promise<ArrayBuffer> {
  if (cachedBrockmann) return cachedBrockmann;

  const fontData = await fetch(
    new URL(FONT_PATHS.brockmann, import.meta.url),
  ).then((res) => res.arrayBuffer());

  cachedBrockmann = fontData;
  return fontData;
}

/**
 * Load all fonts for OG images
 * Returns font config for ImageResponse
 */
export async function loadOGFonts() {
  const [editUndo, brockmann] = await Promise.all([
    loadEditUndoFont(),
    loadBrockmannFont(),
  ]);

  return [
    {
      name: "EditUndo",
      data: editUndo,
      style: "normal" as const,
      weight: 700 as const,
    },
    {
      name: "Brockmann",
      data: brockmann,
      style: "normal" as const,
      weight: 700 as const,
    },
  ];
}

// Common OG image dimensions (Farcaster recommends 3:2 aspect ratio)
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 800;

// Design tokens from Figma
export const COLORS = {
  gold: "#FFC931",
  goldAlt: "#F5BB1B",
  white: "#FFFFFF",
  grayLabel: "#99A0AE",
  green: "#05FF8F",
  darkBg: "#1E1E1E",
  black: "#000000",
} as const;

/**
 * Safely fetch an external image and convert to base64 data URL.
 * Returns null if the image can't be fetched (CORS, 404, timeout, etc.)
 *
 * Use this for external URLs like Farcaster pfpUrls to prevent
 * OG image generation from failing due to unreachable images.
 */
export async function safeImageUrl(
  url: string | null | undefined,
  timeoutMs: number = 3000,
): Promise<string | null> {
  if (!url) {
    console.log("[OG] safeImageUrl: No URL provided");
    return null;
  }

  console.log(`[OG] safeImageUrl: Fetching ${url} (timeout: ${timeoutMs}ms)`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Some CDNs require User-Agent
        "User-Agent": "WafflesOGImageGenerator/1.0",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[OG] safeImageUrl: HTTP ${response.status} for ${url}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    console.log(
      `[OG] safeImageUrl: Success! ${url} (${contentType}, ${buffer.byteLength} bytes)`,
    );

    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[OG] safeImageUrl: Error fetching ${url} - ${errorMessage}`);
    return null;
  }
}
