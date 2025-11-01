import InvitePageClient from "./_components/InvitePageClient";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";

export async function fetchUserWithInviteData(
  fid: string
): Promise<UserWithInviteData | null> {
  const userWithInviteData = await prisma.user.findUnique({
    where: { fid: Number(fid) },
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

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ fid: string }>;
}) {
  const { fid } = await searchParams;
  const userWithInviteData = await fetchUserWithInviteData(fid);
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
