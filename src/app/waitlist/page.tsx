import { prisma } from "@/lib/db";
import { WaitlistClient } from "./client";
import { minikitConfig } from "../../../minikit.config";
import { Metadata } from "next";
import { cache } from "react";
import { env } from "@/lib/env";

export const getWaitlistRank = cache(
  async (fid: number): Promise<number | null> => {
    const user = await getUser(fid);
    if (!user) {
      return null;
    }
    const waitlistCreatedAt = user.waitlist?.createdAt;
    // Step 3: Count all waitlist entries with earlier createdAt date
    const earlierCount = await prisma.waitlist.count({
      where: { createdAt: { lt: waitlistCreatedAt } },
    });

    // Rank is earlierCount + 1 (1-based)
    return earlierCount + 1;
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

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; fid: string }>;
}): Promise<Metadata> {
  const sParams = await searchParams;
  const fid = parseInt(sParams.fid);
  const rank = await getWaitlistRank(fid);

  const IMAGE_URL = `${
    env.rootUrl
  }/api/og/waitlist?fid=${fid}&rank=${rank}&ref=${sParams.ref ?? ""}`;
  console.log("IMAGE_URL", IMAGE_URL);

  return {
    title: minikitConfig.miniapp.name,
    description: `You're #${rank} on the waitlist.`,
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: `${env.rootUrl}/images/waitlist-bg.png`,
        button: {
          title: `Join the waitlist ➡️📋`,
          action: {
            name: `Join the waitlist`,
            type: "launch_frame",
            url: `${env.rootUrl}/waitlist?fid=${fid}&ref=${sParams.ref}`,
            splashImageUrl: minikitConfig.miniapp.splashImageUrl,
            splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
          },
        },
      }),
    },
  };
}

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; fid: string }>;
}) {
  const sParams = await searchParams;
  const referrerFid = sParams.ref ? parseInt(sParams.ref) : null;
  const fid = parseInt(sParams.fid);

  if (!fid) {
    console.error(`FID is missing for waitlist page`);
    throw new Error("FID is missing for waitlist page");
  }

  // Ensure that we always resolve to a WaitlistData object, never null
  const waitlistDataPromise: Promise<WaitlistData> = getUser(fid).then(
    async (user) => {
      if (!user) {
        // Return a default "not on list" WaitlistData if the user is not found
        return {
          onList: false,
          rank: null,
          invites: 0,
        };
      }
      const rank = await getWaitlistRank(user.fid);
      return {
        onList: rank !== null,
        rank,
        invites: user.waitlist?.invites ?? 0,
      };
    }
  );

  return (
    <WaitlistClient
      waitlistDataPromise={waitlistDataPromise}
      referrerFid={referrerFid}
    />
  );
}

export interface WaitlistData {
  onList: boolean;
  rank: number | null;
  invites: number;
}
