"use client";

import { use, useState, useEffect, useMemo } from "react";
import WinningsCard from "../_component/WinningsCard";
import Leaderboard from "./_components/Leaderboard";
import Image from "next/image";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { FlashIcon } from "@/components/icons";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";
import sdk from "@farcaster/miniapp-sdk";
import Link from "next/link";

interface LeaderboardData {
  game: { theme: string } | null;
  allPlayersInGame: Array<{
    score: number;
    user: {
      fid: number;
      username: string | null;
      pfpUrl: string | null;
    } | null;
  }>;
}

interface UserScore {
  score: number;
  rank: number;
  winnings: number;
  percentile: number;
}

// Auth is handled by GameAuthGate in layout
export default function ScorePageClient({
  leaderboardPromise,
}: {
  gameId: number;
  leaderboardPromise: Promise<LeaderboardData>;
}) {
  const leaderboardData = use(leaderboardPromise);

  const [userInfo, setUserInfo] = useState<{ fid: number; username: string; pfpUrl: string } | null>(null);
  const [userScore, setUserScore] = useState<UserScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Top 3 for leaderboard display
  const leaderboard = useMemo(() => {
    return leaderboardData.allPlayersInGame.slice(0, 3).map((p) => ({
      username: p.user?.username ?? "anon",
      pfpUrl: p.user?.pfpUrl ?? "",
      score: p.score,
    }));
  }, [leaderboardData]);

  // Fetch user data (auth verified by layout)
  useEffect(() => {
    async function fetchUserScore() {
      try {
        const userRes = await sdk.quickAuth.fetch("/api/v1/me");
        if (!userRes.ok) throw new Error("Failed to fetch user");

        const userData = await userRes.json();
        setUserInfo({
          fid: userData.fid,
          username: userData.username ?? "Player",
          pfpUrl: userData.pfpUrl ?? "",
        });

        // Find user's position in leaderboard
        const userIndex = leaderboardData.allPlayersInGame.findIndex(
          (p) => p.user?.fid === userData.fid
        );

        if (userIndex !== -1) {
          const player = leaderboardData.allPlayersInGame[userIndex];
          const total = leaderboardData.allPlayersInGame.length;
          const rank = userIndex + 1;

          setUserScore({
            score: player.score,
            rank,
            winnings: rank === 1 ? 50 : 0,
            percentile: total > 0 ? Math.round(((total - rank) / total) * 100) : 0,
          });
        }
      } catch (error) {
        console.error("Error fetching user score:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserScore();
  }, [leaderboardData]);

  if (isLoading) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <WaffleLoader text="LOADING SCORE..." />
        </div>
        <BottomNav />
      </>
    );
  }

  if (!userInfo || !userScore) {
    return (
      <>
        <div className="flex flex-col text-white items-center justify-center min-h-full">
          <p className="text-lg">Score not found.</p>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <div className="w-full px-4 text-white flex flex-col items-center flex-1 overflow-y-auto">
        <Image
          src="/images/illustrations/waffles.svg"
          alt="waffle"
          width={228}
          height={132}
        />

        <h1 className="font-body text-[44px] leading-none">GAME OVER</h1>
        <p className="text-[#99A0AE] text-[16px] font-display mt-1 capitalize">
          {leaderboardData.game?.theme?.toLowerCase() ?? "trivia"}
        </p>

        <WinningsCard
          winnings={userScore.winnings}
          score={userScore.score}
          rank={userScore.rank}
          pfpUrl={userInfo.pfpUrl}
          username={userInfo.username}
        />

        <p className="text-white/80 text-[12px] my-1 flex items-center gap-2 font-display">
          <FlashIcon className="w-[16px] h-[16px] text-[#FFC931]" />
          You finished faster than {userScore.percentile}% of your friends
        </p>

        <div className="w-full max-w-lg mt-6 flex flex-col gap-3">
          <FancyBorderButton className="text-[#14B985] border-[#14B985]">
            SHARE SCORE
          </FancyBorderButton>
          <Link
            href="/game"
            className="
              flex flex-row justify-center items-center
              font-body
              text-[#00CFF2]
              bg-transparent
              border-none
              mt-1
              no-underline
              cursor-pointer
            "
          >
            <span
              className="
                text-[18px]
                flex items-end justify-center text-center flex-none order-1
              "
            >
              BACK TO HOME
            </span>
          </Link>
        </div>

        <Leaderboard entries={leaderboard} className="mt-10" />
      </div>
      <BottomNav />
    </>
  );
}
