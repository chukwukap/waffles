import { Inter, Press_Start_2P, VT323 } from "next/font/google";

// @TODO: ADD NDOT 47 (inspired by NOTHING) font for input

export const fontDisplay = Inter({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-display",
});

export const fontBody = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-body",
});

export const fontInput = VT323({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-input",
});
