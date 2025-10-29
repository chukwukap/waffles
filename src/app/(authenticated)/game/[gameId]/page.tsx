import { GameClientImpl } from "./gameClientImpl";
import React from "react";
import { fetchGameById, fetchUserWithGameDetailsAndReferral } from "@/lib/data";
import { getCurrentUserFid } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function GamePage(props: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await props.params;

  const userFid = await getCurrentUserFid();
  if (!userFid) {
    return <div>User not logged in</div>;
  }
  const game = await fetchGameById(Number(gameId));

  const userInfo = await fetchUserWithGameDetailsAndReferral(
    userFid,
    Number(gameId)
  );

  // Handle case where no game is active after hydration
  if (!game) {
    return notFound();
  }
  if (!userInfo) {
    return <div>User not found</div>;
  }

  return <GameClientImpl game={game} userInfo={userInfo} />;
}

// export const dynamic = "force-dynamic";
