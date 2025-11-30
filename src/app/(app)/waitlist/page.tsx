import { WaitlistClient } from "./client";
import { minikitConfig } from "../../../../minikit.config";
import { Metadata } from "next";

import { env } from "@/lib/env";

import { prisma } from "@/lib/db";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const sParams = await searchParams;
  const rank = sParams.rank ? parseInt(sParams.rank as string) : null;
  const fid = sParams.fid ? parseInt(sParams.fid as string) : null;

  // Fetch user's pfpUrl from database if fid is provided
  let pfpUrl: string | null = null;
  if (fid) {
    try {
      const user = await prisma.user.findUnique({
        where: { fid },
        select: { pfpUrl: true },
      });
      console.log("[API_WAITLIST_DEBUG] user:", user);

      pfpUrl = user?.pfpUrl || null;
    } catch (error) {
      console.error("Failed to fetch user pfpUrl:", error);
    }
  }

  console.log("[API_WAITLIST_DEBUG] rank:", rank);
  console.log("[API_WAITLIST_DEBUG] fid:", fid);
  console.log("[API_WAITLIST_DEBUG] pfpUrl:", pfpUrl);

  // Build OG image URL with rank and pfpUrl
  let IMAGE_URL = `${env.rootUrl}/images/share/waitlist-default.png`;
  if (rank) {
    IMAGE_URL = `${env.rootUrl}/api/og/waitlist?rank=${rank}`;
    if (pfpUrl) {
      IMAGE_URL += `&pfpUrl=${encodeURIComponent(pfpUrl)}`;
    }
  }
  console.log("[API_WAITLIST_DEBUG] IMAGE_URL:", IMAGE_URL);

  return {
    title: minikitConfig.miniapp.name,
    description: rank
      ? `You're #${rank} on the waitlist.`
      : "Join the Waffles waitlist.",
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: IMAGE_URL,
        button: {
          title: `Join the waitlist ➡️📋`,
          action: {
            name: `Join the waitlist`,
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

// export async function generateStaticParams() {
//   const params = [];
//   for (let i = 1; i <= 1000; i++) {
//     params.push({ rank: i.toString() });
//   }
//   return params;
// }

export default async function WaitlistPage() {
  return <WaitlistClient />;
}
