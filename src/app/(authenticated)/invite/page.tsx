import InviteCodePage from "./_components/InvitePageClient";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";

// Get the current user's fid from cookies
export async function getCurrentUserFid(): Promise<number | null> {
  const cookieStore = await cookies();
  const fidCookie = cookieStore.get("fid")?.value;
  if (!fidCookie || isNaN(Number(fidCookie))) return null;
  return Number(fidCookie);
}

export async function fetchUserWithInviteData(): Promise<UserWithInviteData | null> {
  const userFid = await getCurrentUserFid();

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

  return <InviteCodePage userWithInviteData={userWithInviteData} />;
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
