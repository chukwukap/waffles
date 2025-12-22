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
    new URL(FONT_PATHS.editUndo, import.meta.url)
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
    new URL(FONT_PATHS.brockmann, import.meta.url)
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

// Common OG image dimensions
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

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
