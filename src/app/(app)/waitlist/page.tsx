import { WaitlistClient } from "./client";
import { LaunchAnnouncement } from "./_components/LaunchAnnouncement";
import { minikitConfig } from "@minikit-config";
import { Metadata } from "next";

import { env } from "@/lib/env";
import { IS_LAUNCH_MODE } from "@/lib/constants";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  // If in launch mode, show launch-specific metadata
  if (IS_LAUNCH_MODE) {
    return {
      title: "Waffles - Game Starts Soon",
      description: "The waitlist is over. Game starts soon!",
      other: {
        "fc:frame": JSON.stringify({
          version: minikitConfig.miniapp.version,
          imageUrl: `${env.rootUrl}/images/hero-image.png`,
          button: {
            title: `Game Starts Soon 🎮`,
            action: {
              name: `View Announcement`,
              type: "launch_frame",
              url: `${env.rootUrl}/waitlist`,
              splashImageUrl: minikitConfig.miniapp.splashImageUrl,
              splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
            },
          },
        }),
      },
    };
  }

  const sParams = await searchParams;
  const rank = sParams.rank ? parseInt(sParams.rank as string) : null;
  const ref = (sParams.ref as string) || null;
  const pfpUrl = sParams.pfpUrl as string | undefined;

  // Build OG image URL with rank and optional pfpUrl
  let IMAGE_URL_PATH = `${env.rootUrl}/images/hero-image.png`;
  if (rank) {
    const ogParams = new URLSearchParams();
    ogParams.set("rank", rank.toString());
    if (pfpUrl) {
      ogParams.set("pfpUrl", pfpUrl);
    }
    IMAGE_URL_PATH = `${env.rootUrl}/api/og/waitlist?${ogParams.toString()}`;
  }

  return {
    title: minikitConfig.miniapp.name,
    description: rank
      ? `You're #${rank} on the waitlist.`
      : "Join the Waffles waitlist.",
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: IMAGE_URL_PATH,
        button: {
          title: `Join the waitlist ➡️📋`,
          action: {
            name: `Join the waitlist`,
            type: "launch_frame",
            url: ref
              ? `${env.rootUrl}/waitlist?ref=${ref}`
              : `${env.rootUrl}/waitlist`,
            splashImageUrl: minikitConfig.miniapp.splashImageUrl,
            splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
          },
        },
      }),
    },
  };
}

export default async function WaitlistPage() {
  // Show launch announcement if in launch mode
  if (IS_LAUNCH_MODE) {
    return <LaunchAnnouncement />;
  }

  return <WaitlistClient />;
}
