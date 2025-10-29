import InvitePageClient from "./_components/InvitePageClient";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { getCurrentUserFid } from "@/lib/auth";

export async function fetchUserWithInviteData(): Promise<UserWithInviteData | null> {
  const userFid = await getCurrentUserFid();

  if (!userFid) {
    return notFound();
  }

  const userWithInviteData = await prisma.user.findUnique({
    where: { fid: Number(userFid) },
    select: {
      fid: true,
      name: true,
      imageUrl: true,
      referrals: {
        take: 1,
        select: {
          code: true,
          inviter: {
            select: { fid: true, name: true, imageUrl: true },
          },
        },
      },
    },
  });
  if (!userWithInviteData) return null;

  return userWithInviteData;
}

export default async function InvitePage() {
  const userWithInviteData = await fetchUserWithInviteData();
  if (!userWithInviteData) {
    notFound();
  }

  return <InvitePageClient userWithInviteData={userWithInviteData} />;
}

export type UserWithInviteData = Prisma.UserGetPayload<{
  select: {
    fid: true;
    name: true;
    imageUrl: true;
    referrals: {
      take: 1;
      select: {
        code: true;
        inviter: {
          select: { fid: true; name: true; imageUrl: true };
        };
      };
    };
  };
}>;
