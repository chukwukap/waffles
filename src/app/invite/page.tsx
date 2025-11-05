import InvitePageClient from "./_components/InvitePageClient";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { cache, Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ fid: string }>;
}) {
  const { fid } = await searchParams;
  const getUserWithInviteData = cache(async (fid: number) =>
    prisma.user.findUnique({
      where: { fid },
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
    })
  );

  const payloadPromise = getUserWithInviteData(Number(fid));

  return (
    <Suspense fallback={<Spinner />}>
      <InvitePageClient payloadPromise={payloadPromise} />
    </Suspense>
  );
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
