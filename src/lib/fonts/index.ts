import localFont from "next/font/local";

export const fontDisplay = localFont({
  src: [
    {
      path: "./brockmann_bd.otf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-display",
});

export const fontBody = localFont({
  src: [
    {
      path: "./editundo_bd.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-body",
});

export const fontInput = localFont({
  src: [
    {
      path: "./ndot47_bd.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-input",
});
