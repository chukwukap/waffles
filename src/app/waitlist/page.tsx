"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { WaitlistClient } from "./_components/waitlistClient";
import { minikitConfig } from "../../../minikit.config";
import { Metadata } from "next";
import { cache, Suspense } from "react";
import { Spinner } from "@/components/ui/spinner"; // Assuming you have a spinner

// --- METADATA (Unchanged) ---
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

// --- NEW DATA PAYLOAD TYPE ---
export interface WaitlistData {
  waitlist: {
    onList: boolean;
    rank: number | null;
    invites: number;
  };
  userFid: number;
}

// --- NEW CACHED DATA FETCHER ---
/**
 * Fetches the user and their waitlist status in a single, cached function.
 * Throws a redirect if the user is not found.
 */
export const getWaitlistData = cache(
  async (fid: number): Promise<WaitlistData> => {
    // 1. Get the user
    const user = await prisma.user.findUnique({ where: { fid } });

    // 2. Handle redirect if user not found
    if (!user) {
      // This redirect will be caught by Next.js
      redirect(`/profile?fid=${fid}`);
    }

    // 3. Get waitlist status
    const waitlistEntry = await prisma.waitlist.findUnique({
      where: { userId: user.id },
    });

    if (!waitlistEntry) {
      return {
        waitlist: { onList: false, rank: null, invites: 0 },
        userFid: user.fid,
      };
    }

    // 4. Determine rank
    const earlierCount = await prisma.waitlist.count({
      where: { createdAt: { lt: waitlistEntry.createdAt } },
    });

    return {
      waitlist: {
        onList: true,
        rank: earlierCount + 1,
        invites: waitlistEntry.invites ?? 0,
      },
      userFid: user.fid,
    };
  }
);

// --- UPDATED PAGE COMPONENT ---
export default async function WaitlistPage({
  searchParams,
}: {
  // The FID should be provided by minikit middleware
  searchParams: Promise<{ ref?: string; fid: number }>;
}) {
  const sParams = await searchParams;
  const referrerFid = sParams.ref ? parseInt(sParams.ref) : null;
  const fid = sParams.fid;

  // This check is still valid
  if (!fid) {
    // Redirect to a default page if FID is missing entirely
    redirect(`/profile?fid=${fid}`);
  }

  // 1. Get the promise for the data (don't await it here)
  const waitlistDataPromise = getWaitlistData(fid);

  // 2. Render the client, passing the promise, wrapped in Suspense
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <WaitlistClient
        waitlistDataPromise={waitlistDataPromise}
        referrerFid={referrerFid}
      />
    </Suspense>
  );
}
