"use client";

import { use, useState, useEffect, useMemo, useRef } from "react";
import StatsCard from "../_component/StatsCard";
import Leaderboard from "./_components/Leaderboard";
import Image from "next/image";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { FlashIcon } from "@/components/icons";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";
import { playSound } from "@/lib/sounds";
import sdk from "@farcaster/miniapp-sdk";
import Link from "next/link";
import { motion } from "framer-motion";

interface LeaderboardData {
  game: { theme: string } | null;
  allPlayersInGame: Array<{
    score: number;
    rank: number | null;
    prize: number | null;
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
  leaderboardPromise: Promise<LeaderboardData>;
}) {
  const leaderboardData = use(leaderboardPromise);

  const [userInfo, setUserInfo] = useState<{
    fid: number;
    username: string;
    pfpUrl: string;
  } | null>(null);
  const [userScore, setUserScore] = useState<UserScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasPlayedSound = useRef(false);

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
          const rank = player.rank ?? userIndex + 1;
          // Percentile: what % of players you beat
          const percentile =
            total > 1 ? Math.round(((total - rank) / (total - 1)) * 100) : 100;

          setUserScore({
            score: player.score,
            rank,
            winnings: player.prize ?? 0,
            percentile: Math.max(0, Math.min(100, percentile)),
          });

          // Play victory or defeat sound based on rank (only once)
          if (!hasPlayedSound.current) {
            hasPlayedSound.current = true;
            playSound(rank <= 3 ? "victory" : "defeat");
          }
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
        <div className="flex flex-col justify-center items-center gap-2 w-[315px]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.1,
            }}
          >
            <Image
              src="/images/illustrations/waffles.svg"
              alt="waffle"
              width={228}
              height={132}
            />
          </motion.div>

          <motion.h1
            className="font-body text-[44px] leading-[92%] text-center tracking-[-0.03em] text-white w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            GAME OVER
          </motion.h1>

          <motion.div
            className="flex flex-row justify-center items-center gap-2.5 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <p className="font-display font-medium text-[16px] leading-[130%] text-center tracking-[-0.03em] text-[#99A0AE] capitalize">
              {leaderboardData.game?.theme?.toLowerCase() ?? "trivia"}
            </p>
          </motion.div>
        </div>

        <StatsCard
          winnings={userScore.winnings}
          score={userScore.score}
          rank={userScore.rank}
          pfpUrl={userInfo.pfpUrl}
          username={userInfo.username}
        />
        <div className="flex flex-col justify-center items-center gap-3 w-[361px] mt-5">
          {/* Percentile row */}
          <motion.div
            className="flex flex-row items-center gap-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut",
              }}
            >
              <FlashIcon className="w-4 h-4 text-[#FFC931]" />
            </motion.div>
            <span className="font-display font-medium text-[12px] leading-[14px] tracking-[-0.03em] text-white">
              You finished faster than {userScore.percentile}% of your friends
            </span>
          </motion.div>

          {/* Buttons container */}
          <div className="flex flex-col items-start gap-5 w-full">
            {/* Claim Prize Button */}
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/profile/games" className="w-full no-underline">
                <FancyBorderButton className="text-[#14B985] border-[#14B985]">
                  CLAIM PRIZE
                </FancyBorderButton>
              </Link>
            </motion.div>

            {/* Share Score & Back to Home row */}
            <motion.div
              className="flex flex-row items-start gap-3 w-full"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              {/* Share Score Button */}
              <motion.button
                className="flex flex-row justify-center items-center p-3 gap-2 flex-1 bg-white/9 border-2 border-white/40 rounded-[12px]"
                whileHover={{
                  scale: 1.03,
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  borderColor: "rgba(255, 255, 255, 0.6)",
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <span className="font-body font-normal text-[18px] leading-[115%] tracking-[-0.02em] text-white">
                  SHARE SCORE
                </span>
              </motion.button>

              {/* Back to Home Button */}
              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href="/game"
                  className="flex flex-row justify-center items-center p-3 gap-2 w-full bg-white/9 border-2 border-white/40 rounded-[12px] no-underline hover:bg-white/15 hover:border-white/60 transition-colors duration-200"
                >
                  <span className="font-body font-normal text-[18px] leading-[115%] tracking-[-0.02em] text-white">
                    BACK TO HOME
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <Leaderboard entries={leaderboard} />
      </div>
      <BottomNav />
    </>
  );
}
