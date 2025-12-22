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

  // Build OG image URL with rank and ref (referrer's fid)
  // Build OG image URL with rank and ref (referrer's fid)
  // The ref is the person who shared the link, so their avatar should appear
  let IMAGE_URL_PATH = `${env.rootUrl}/images/hero-image.png`;
  if (rank && ref) {
    IMAGE_URL_PATH = `${env.rootUrl}/api/og/waitlist?rank=${rank}&fid=${ref}`;
  } else if (rank) {
    // Fallback for rank without ref
    IMAGE_URL_PATH = `${env.rootUrl}/api/og/waitlist?rank=${rank}`;
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
