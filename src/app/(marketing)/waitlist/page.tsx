import { prisma } from "@/lib/db";
import { WaitlistClient } from "./client";
import { minikitConfig } from "../../../../minikit.config";
import { Metadata } from "next";
import { cache } from "react";
import { env } from "@/lib/env";

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const sParams = await searchParams;
  // We need to get the fid from the ref to calculate the rank for the person being shared
  const refFid = sParams.ref ? parseInt(sParams.ref as string) : null;
  let rank: number | null = null;

  if (refFid) {
    rank = await getWaitlistRank(refFid);
  }

  const IMAGE_URL = sParams.ref
    ? `${env.rootUrl}/api/og/waitlist?rank=${rank}&ref=${sParams.ref}`
    : `${env.rootUrl}/images/share/waitlist-default.png`;

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

/**
 * Calculates fair waitlist rank, considering both invites and creation time.
 * A user's rank is determined by their "score".
 * - Score = inviteQuota * 1_000_000_000 - createdAt timestamp (higher score is better)
 * - Higher invite quota always ranks above, earlier join time breaks ties.
 * Returns 1-based rank (1 = best). Returns null if not on waitlist.
 */
export const getWaitlistRank = cache(
  async (fid: number): Promise<number | null> => {
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true, status: true, inviteQuota: true, createdAt: true },
    });

    // Not on waitlist or not a user
    if (!user || user.status !== "WAITLIST") {
      return null;
    }

    // Calculate the user's score
    const userScore =
      user.inviteQuota * 1_000_000_000 - new Date(user.createdAt).getTime();

    // Find how many waitlist entries have a better (higher) score
    const allEntries = await prisma.user.findMany({
      where: { status: "WAITLIST" },
      select: { inviteQuota: true, createdAt: true },
    });

    let betterCount = 0;
    for (const entry of allEntries) {
      const entryScore =
        entry.inviteQuota * 1_000_000_000 - new Date(entry.createdAt).getTime();

      if (entryScore > userScore) {
        betterCount++;
      }
    }

    return betterCount + 1; // 1-based rank
  }
);

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function WaitlistPage() {
  return <WaitlistClient />;
}
