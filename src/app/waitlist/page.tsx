"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";

import { WaitlistClient } from "./_components/waitlistClient";

import { minikitConfig } from "../../../minikit.config";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: minikitConfig.miniapp.name,
    description: minikitConfig.miniapp.description,
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        button: {
          title: `Launch ${minikitConfig.miniapp.name}`,
          action: {
            name: `Launch ${minikitConfig.miniapp.name}`,
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
// Get the current user's model by fid
async function getCurrentUserByFid(fid: number) {
  return prisma.user.findUnique({ where: { fid } });
}

async function getWaitlistStatus(userId: number) {
  const waitlistEntry = await prisma.waitlist.findUnique({
    where: { userId },
  });

  if (!waitlistEntry) return { onList: false, rank: null, invites: 0 };

  // Determine rank by ordering by createdAt
  const earlierCount = await prisma.waitlist.count({
    where: { createdAt: { lt: waitlistEntry.createdAt } },
  });

  return {
    onList: true,
    rank: earlierCount + 1,
    invites: waitlistEntry.invites ?? 0,
  };
}

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; fid: number }>;
}) {
  const sParams = await searchParams;
  const referrerFid = sParams.ref;
  const fid = sParams.fid;

  if (!fid) return redirect(`/profile?fid=${fid}`);

  const user = await getCurrentUserByFid(fid);
  if (!user) return redirect(`/profile?fid=${fid}`);

  const waitlist = await getWaitlistStatus(user.id);

  console.log("waitlist", waitlist);

  return (
    <WaitlistClient
      waitlist={waitlist}
      fid={fid}
      referrerFid={referrerFid ? parseInt(referrerFid) : null}
    />
  );
}
