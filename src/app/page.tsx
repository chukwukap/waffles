import { Metadata } from "next";

import { minikitConfig } from "../../minikit.config";
import { RootPageClient } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: minikitConfig.miniapp.name,
    description: minikitConfig.miniapp.description,
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        button: {
          title: `Play now`,
          action: {
            name: `Play now`,
            type: "launch_frame",
            url: minikitConfig.miniapp.homeUrl,
            splashImageUrl: minikitConfig.miniapp.splashImageUrl,
            splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
          },
        },
      }),
    },
  };
}

/**
 * Root page component for the application.
 * Immediately redirects users to the waitlist view ('/waitlist').
 * This is handled server-side for efficiency.
 */
export default function Home() {
  return <RootPageClient />;
}
