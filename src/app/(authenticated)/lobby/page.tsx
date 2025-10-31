import {
  fetchUpcomingGames,
  fetchUserWithGameDetailsAndReferral,
} from "@/lib/data";
import LobbyPageClientImpl from "./lobbyClient";

import { redirect } from "next/navigation";
import { getCurrentUserFid } from "@/lib/auth";

export default async function LobbyPage() {
  const games = await fetchUpcomingGames();

  const userFid = await getCurrentUserFid();
  if (!userFid) {
    throw new Error("User not found in LobbyPage");
  }

  // if there is no active game, redirect to waitlist
  if (games.length === 0) {
    console.info("No active game found, redirecting to waitlist");
    return redirect("/waitlist");
  }

  const userInfo = await fetchUserWithGameDetailsAndReferral(
    userFid,
    games[0].id
  );

  // if (!userInfo) {
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-[80dvh] text-center px-4">
  //       User not found. likely not onboarded yet
  //     </div>
  //   );
  // }

  return <LobbyPageClientImpl games={games} userInfo={userInfo} />;
}

export const dynamic = "force-dynamic";
