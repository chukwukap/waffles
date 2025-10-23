import DeviceGate from "@/components/DeviceGate";
import "./globals.css";
import { fontBody, fontDisplay, fontInput } from "@/lib/fonts";
import "./globals.css";

import { MinikitProvider } from "@/components/providers/MinikitProvider";
import GlobalToaster from "@/components/ui/Toaster";
import { Metadata } from "next";
import * as constants from "@/lib/constants";
import { OnboardingGate } from "@/components/onboarding/gate";  

export async function generateMetadata(): Promise<Metadata> {
  const URL = constants.BASE_URL;
  return {
    other: {
      "fc:miniapp": JSON.stringify({
        version: "next",
        imageUrl: constants.FARCASTER_ICON_URL,
        button: {
          title: constants.FARCASTER_TAGLINE,
          action: {
            type: "launch_miniapp",
            name: "Waffles",
            url: URL,
            splashImageUrl: constants.FARCASTER_SPLASH_IMAGE_URL,
            splashBackgroundColor: constants.FARCASTER_SPLASH_BACKGROUND_COLOR,
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
            <OnboardingGate>
              {children}
            </OnboardingGate>
          </MinikitProvider>
        </DeviceGate>
        <GlobalToaster />
      </body>
    </html>
  );
}
