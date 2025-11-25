import "./globals.css";
import { fontBody, fontDisplay, fontInput } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Waffles",
  description: "Pattern-matching tournaments built for Farcaster.",
  keywords: ["waffles", "games", "farcaster", "social", "tournaments", "fun"],
  openGraph: {
    title: "Waffles",
    description: "Play daily social games",
    url: "https://demo.playwaffles.fun",
    type: "website",
    images: [
      {
        url: "/og.png",
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
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  metadataBase: new URL("https://demo.playwaffles.fun"),
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
      </body>
    </html>
  );
}
