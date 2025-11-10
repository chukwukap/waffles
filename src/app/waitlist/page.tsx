import { prisma } from "@/lib/db";
import { WaitlistClient } from "./client";
import { minikitConfig } from "../../../minikit.config";
import { Metadata } from "next";
import { cache } from "react";
import { env } from "@/lib/env";

/**
 * Calculates fair waitlist rank, considering both creation time and invites.
 * A user's rank is determined by their waitlist "score" (more invites = better), then by earliest join.
 * - Score = invites * 10000 - createdAt timestamp (smaller = better)
 * - Higher invites always ranks above, earlier join time breaks ties.
 * Returns 1-based rank (1 = best). Returns null if not on waitlist.
 */
export const getWaitlistRank = cache(
  async (fid: number): Promise<number | null> => {
    const user = await getUser(fid);
    if (!user || !user.waitlist) {
      return null;
    }

    const waitlistEntry = user.waitlist;
    const userScore =
      (waitlistEntry.invites || 0) * 10000 -
      new Date(waitlistEntry.createdAt).getTime();

    // Find how many waitlist entries have a better (lower) score
    const allEntries = await prisma.waitlist.findMany({
      select: { invites: true, createdAt: true },
    });

    let betterCount = 0;
    for (const entry of allEntries) {
      const entryScore =
        (entry.invites || 0) * 10000 - new Date(entry.createdAt).getTime();
      if (entryScore > userScore) {
        // lower score = better
        continue;
      }
      if (entryScore < userScore) {
        betterCount++;
      }
      // If scores are equal, do not increment (user and entry tie, i.e., the user is only ranked after those clearly better).
    }

    return betterCount + 1; // 1-based rank
  }
);

export const getUser = cache(async (fid: number) => {
  const user = await prisma.user.findUnique({
    where: { fid },
    select: { id: true, fid: true, waitlist: true },
  });

  if (!user) {
    console.error(`User not found for fid: ${fid}`);
    return null;
  }

  return user;
});

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const sParams = await searchParams;
  const rank = sParams.rank ? parseInt(sParams.rank as string) : null;

  const IMAGE_URL = sParams.ref
    ? `${env.rootUrl}/api/og/waitlist?rank=${rank}&ref=${sParams.ref}`
    : `${env.rootUrl}/images/share/waitlist-bg.png`;

  return {
    title: minikitConfig.miniapp.name,
    description: `You're #${rank} on the waitlist.`,
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

export default async function WaitlistPage() {
  return <WaitlistClient />;
}
