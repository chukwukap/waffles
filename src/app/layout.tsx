import "./globals.css";
import { fontBody, fontDisplay, fontInput } from "@/lib/fonts";
import { Metadata } from "next";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

import { headers } from "next/headers";

import { Providers } from "@/components/providers/";

export async function generateMetadata(): Promise<Metadata> {
  const fcMiniappMeta = {
    version: "next",
    imageUrl: `${env.rootUrl}/logo.png`,
    button: {
      title: "Waffles",
      action: {
        type: "launch_miniapp",
        name: "Waffles",
        url: env.rootUrl,
        splashImageUrl: `${env.rootUrl}/images/splash-icon.png`,
        // splashBackgroundColor: "#1E1E1E",
      },
    },
  };
  return {
    title: "Waffles Game",
    description: "Join the Waffles game!",
    other: {
      "fc:miniapp": JSON.stringify(fcMiniappMeta),
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      // Apply font variables to the html tag for global access
      className={cn(
        fontBody.variable, // [cite: 674]
        fontDisplay.variable, // [cite: 674]
        fontInput.variable, // [cite: 674]
        "suppress-hydration-warning" // Recommended when using next-themes or client-side theme logic
      )}
      suppressHydrationWarning // Suppress warning related to client/server mismatch (often due to themes or extensions)
    >
      <body
        className={cn(
          "text-foreground bg-figma noise", // Base body styles [cite: 674]
          "antialiased" // Improve font rendering
        )}
      >
        {/* Use the Providers component to wrap client-side context providers */}
        <Providers>
          {children} {/* Render the active page/route segment */}
        </Providers>
      </body>
    </html>
  );
}
