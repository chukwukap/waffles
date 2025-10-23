import DeviceGate from "@/components/DeviceGate";
import "./globals.css";
import { fontBody, fontDisplay, fontInput } from "@/lib/fonts";
import "./globals.css";

import { MinikitProvider } from "@/components/providers/MinikitProvider";
import GlobalToaster from "@/components/ui/Toaster";
import { Metadata } from "next";
import { env } from "@/lib/env";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

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
            splashBackgroundColor: "#000000",
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
        <DeviceGate continueAnyway={process.env.NODE_ENV == "production"}>
          <MinikitProvider>
            <OnboardingGate>{children}</OnboardingGate>
          </MinikitProvider>
        </DeviceGate>
        <GlobalToaster />
      </body>
    </html>
  );
}
