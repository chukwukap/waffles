import { WaitlistClient } from "./client";
import { minikitConfig } from "../../../../minikit.config";
import { Metadata } from "next";

import { env } from "@/lib/env";
import { buildWaitlistOGUrl } from "@/lib/cloudinary-og";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const sParams = await searchParams;
  const rank = sParams.rank ? parseInt(sParams.rank as string) : null;
  const ref = sParams.ref ? parseInt(sParams.ref as string) : null;

  // Build OG image URL with Cloudinary (or fallback to static image)
  let IMAGE_URL_PATH = `${env.rootUrl}/images/hero-image.png`;
  if (rank) {
    const cloudinaryUrl = buildWaitlistOGUrl({ rank });
    if (cloudinaryUrl) {
      IMAGE_URL_PATH = cloudinaryUrl;
    }
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
