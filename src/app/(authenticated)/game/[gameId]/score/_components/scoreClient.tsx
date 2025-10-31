"use client";

import WinningsCard from "./WinningsCard";
import Leaderboard from "./Leaderboard";
import Image from "next/image";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { useAccount } from "wagmi";
import { env } from "@/lib/env";
import { base } from "viem/chains";
import { cn } from "@/lib/utils";
import LogoIcon from "@/components/logo/LogoIcon";
import { FlashIcon, WalletIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

interface LeaderboardEntry {
  username: string;
  avatarUrl?: string | null;
  score: number;
}

interface Props {
  category: string;
  winnings: number;
  score: number;
  rank: number;
  percentile: number; // 0–100
  leaderboard: LeaderboardEntry[];
  userInfo: {
    username: string;
    avatarUrl: string;
  };
}

export default function ScorePageClient({
  category,
  winnings,
  score,
  rank,
  percentile,
  leaderboard,
  userInfo,
}: Props) {
  const account = useAccount();
  const router = useRouter();
  const { roundedBalance } = useGetTokenBalance(
    account.address as `0x${string}`,
    {
      address: env.nextPublicUsdcAddress as `0x${string}`,
      chainId: base.id,
      decimals: 6,
      image: "/images/tokens/usdc.png",
      name: "USDC",
      symbol: "USDC",
      // Removed unnecessary token details if configured globally or relying on defaults
    }
  );
  return (
    <div className="flex flex-col text-white overflow-hidden">
      {/* ─────────────── Header ─────────────── */}
      <header
        className={cn(
          "p-1 px-3 flex items-center justify-between border-b border-border bg-[#191919]"
        )}
      >
        <LogoIcon />
        <div
          className="flex flex-row justify-center items-center px-3 py-1.5 gap-1 rounded-full"
          style={{
            width: 96,
            height: 28,
            background: "rgba(249,249,249,0.1)",
            borderRadius: 900,
          }}
        >
          <span
            className="flex items-center justify-center"
            style={{
              width: 16,
              height: 16,
              flex: "none",
              order: 0,
              flexGrow: 0,
              position: "relative",
            }}
          >
            <WalletIcon className="w-4 h-4 text-white" />
          </span>
          <span
            className="font-edit-undo text-white"
            style={{
              fontStyle: "normal",
              fontWeight: 400,
              fontSize: 16,
              lineHeight: "14px",
              width: 52,
              height: 14,
              textAlign: "center" as const,
              flex: "none",
              order: 1,
              flexGrow: 0,
              display: "inline-block",
            }}
          >{`$${roundedBalance ?? "0"}`}</span>
        </div>
      </header>
      <div className="w-full px-4  text-white flex flex-col items-center  flex-1 overflow-y-auto">
        <Image
          src="/images/illustrations/waffles.svg"
          alt="waffle"
          width={200}
          height={200}
          className="mb-4"
        />

        <h1 className="font-pixel text-[44px] leading-none">GAME OVER</h1>
        <p className="text-[#99A0AE] text-[16px] font-sans mt-1 uppercase">
          {category} & Anime
        </p>

        <WinningsCard
          winnings={winnings}
          score={score}
          rank={rank}
          avatarUrl={userInfo.avatarUrl}
          username={userInfo.username}
        />

        <p className="text-white/80 text-sm mt-3 flex items-center gap-2 font-display">
          <FlashIcon className="w-4 h-4 text-[#FFC931]" />
          You finished faster than {percentile}% of your friends
        </p>

        <div className="w-full max-w-[360px] mt-6 flex flex-col gap-3">
          <FancyBorderButton className="text-[#14B985] border-[#14B985]">
            SHARE SCORE
          </FancyBorderButton>
          <button
            className="
            flex flex-row justify-center items-center
            font-body
            text-[#00CFF2]
            bg-transparent
            border-none
            mt-1"
            onClick={() => router.push("/lobby")}
          >
            <span
              className="
              w-[107px] h-[21px] flex items-end justify-center text-center flex-none order-1"
            >
              BACK TO HOME
            </span>
          </button>
        </div>

        <Leaderboard entries={leaderboard} className="mt-10" />
      </div>
    </div>
  );
}
