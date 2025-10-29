import "./globals.css";
import { fontBody, fontDisplay, fontInput } from "@/lib/fonts";
import { Metadata } from "next";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

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
      className={cn(
        fontBody.variable,
        fontDisplay.variable,
        fontInput.variable,
        "suppress-hydration-warning"
      )}
      suppressHydrationWarning
    >
      <body
        className={cn("text-foreground bg-figma noise h-full overflow-hidden")}
      >
        <Providers>
          <div className="h-[100dvh] flex flex-col overflow-hidden">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
