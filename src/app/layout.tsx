import "./globals.css";
import { fontBody, fontDisplay, fontInput } from "@/lib/fonts";
import "./globals.css";

import { Metadata } from "next";
import { env } from "@/lib/env";
import { Providers } from "@/components/providers";

export async function generateMetadata(): Promise<Metadata> {
  return {
    other: {
      "fc:miniapp": JSON.stringify({
        version: "next",
        imageUrl: `${env.rootUrl}/logo.png`,
        button: {
          title: "Waffles",
          action: {
            type: "launch_miniapp",
            name: "Waffles",
            url: env.rootUrl,
            splashImageUrl: `${env.rootUrl}/images/splash-icon.png`,
            splashBackgroundColor: "#1E1E1E",
          },
        },
      }),
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
      className={`${fontBody.variable} ${fontDisplay.variable} ${fontInput.variable}`}
    >
      <body className="text-foreground bg-figma noise">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
