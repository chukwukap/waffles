import "./globals.css";
import { fontBody, fontDisplay, fontInput } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Waffles",
  description: "Pattern-matching tournaments built for everyone.",
  keywords: ["waffles", "games", "farcaster", "social", "tournaments", "fun"],
  openGraph: {
    title: "Waffles",
    description: "Play daily social games",
    url: "https://miniapp.playwaffles.fun",
    type: "website",
    images: [
      {
        url: "/images/hero-image.png",
        width: 1200,
        height: 630,
        alt: "Waffles OG Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Waffles",
    description: "Play daily social games",
    images: ["/images/hero-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  metadataBase: new URL("https://miniapp.playwaffles.fun"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        fontBody.variable,
        fontDisplay.variable,
        fontInput.variable,
        "suppress-hydration-warning"
      )}
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
