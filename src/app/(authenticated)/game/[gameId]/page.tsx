import { GameClientImpl } from "./gameClientImpl";
import { HydratedUser } from "@/state/types";
import React from "react";
import { cookies } from "next/headers";
import { fetchGameById, fetchUserWithGameDetailsAndReferral } from "@/lib/data";

export default async function GamePage(props: {
  params: Promise<{ gameId: string }>;
  searchParams?: Record<string, string>;
}) {
  const { gameId } = await props.params;

  // Read fid from cookies (should be set somewhere on login/auth)
  let userFid: number | undefined = undefined;
  const cookieStore = await cookies();
  const fidCookie = cookieStore.get("fid")?.value; // Expecting string
  if (fidCookie && !isNaN(Number(fidCookie))) {
    userFid = Number(fidCookie);
  }

  const game = await fetchGameById(Number(gameId));

  // Only fetch user if we have a fid from cookies, and pass to GameClientImpl
  let userInfo: HydratedUser | null = null;
  if (userFid !== undefined) {
    userInfo = await fetchUserWithGameDetailsAndReferral(
      userFid,
      Number(gameId)
    );
  }
  // Handle case where no game is active after hydration
  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80dvh] text-center px-4">
        Game not found
      </div>
    );
  }
  if (!userInfo) {
    return <div>User not found</div>;
  }

  return <GameClientImpl game={game} userInfo={userInfo} />;
}

export const dynamic = "force-dynamic";
