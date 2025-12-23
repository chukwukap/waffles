import { WaitlistClient } from "./client";
import { minikitConfig } from "../../../../minikit.config";
import { Metadata } from "next";

import { env } from "@/lib/env";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const sParams = await searchParams;
  const rank = sParams.rank ? parseInt(sParams.rank as string) : null;
  const ref = sParams.ref ? parseInt(sParams.ref as string) : null;
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
  return <WaitlistClient />;
}
