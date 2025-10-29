import {
  fetchUpcomingGames,
  fetchUserWithGameDetailsAndReferral,
} from "@/lib/data";
import LobbyPageClientImpl from "./lobbyClient";

import { cookies } from "next/headers";

export default async function LobbyPage() {
  const games = await fetchUpcomingGames();
  console.log("games", games);

  let userInfo = null;
  let userFid: number | undefined = undefined;
  const cookieStore = await cookies();
  const fidCookie = cookieStore.get("fid")?.value;
  if (fidCookie && !isNaN(Number(fidCookie))) {
    userFid = Number(fidCookie);
  }
  console.log("userFid", userFid);
  console.log("games", games);

  if (userFid !== undefined && games.length > 0) {
    userInfo = await fetchUserWithGameDetailsAndReferral(userFid, games[0].id);
  }

  if (!userInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80dvh] text-center px-4">
        User not found. likely not onboarded yet
      </div>
    );
  }

  return <LobbyPageClientImpl games={games} userInfo={userInfo} />;
}
