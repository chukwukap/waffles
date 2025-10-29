"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";

import { WaitlistClient } from "./_components/waitlistClient";
import { getCurrentUserFid } from "@/lib/auth";
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
  searchParams: Promise<{ ref?: string }>;
}) {
  const referrerFid = (await searchParams).ref;
  const fid = await getCurrentUserFid();
  if (!fid) return redirect("/profile");

  const user = await getCurrentUserByFid(fid);
  if (!user) return redirect("/profile");

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
