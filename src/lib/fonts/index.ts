import localFont from "next/font/local";

export const fontDisplay = localFont({
  src: [
    {
      path: "./fonts/brockmann_bd.otf",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-display",
});

export const fontBody = localFont({
  src: [
    {
      path: "./fonts/editundo_bd.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-body",
});

export const fontInput = localFont({
  src: [
    {
      path: "./fonts/ndot47_bd.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-input",
});
