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
import { WalletIcon } from "@/components/icons";
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
    <>
      {/* ─────────────── Header ─────────────── */}
      <header
        className={cn(
          //
          "p-4 flex items-center justify-between border-b border-border " //
        )}
      >
        <LogoIcon /> {/* */}
        <div className="flex items-center gap-1.5  rounded-full px-3 py-1.5">
          <WalletIcon className="w-4 h-4 text-foreground" />
          <span className="text-xs text-foreground">{`$${
            roundedBalance ? roundedBalance : "---"
          }`}</span>
        </div>
      </header>
      <div className="min-h-screen w-full  text-white flex flex-col items-center  flex-1 overflow-y-auto">
        <Image
          src="/images/illustrations/waffles.svg"
          alt="waffle"
          width={160}
          height={160}
          className="mb-4"
        />

        <h1 className="font-pixel text-[44px] leading-none">GAME OVER</h1>
        <p className="text-[#99A0AE] text-[16px] font-sans mt-1">{category}</p>

        <WinningsCard
          winnings={winnings}
          score={score}
          rank={rank}
          avatarUrl={userInfo.avatarUrl}
          username={userInfo.username}
        />

        <p className="text-white/80 text-xs mt-4 flex items-center gap-2">
          ⚡ You finished faster than {percentile}% of your friends
        </p>

        <div className="w-full max-w-[360px] mt-6 flex flex-col gap-3">
          <FancyBorderButton>SHARE SCORE</FancyBorderButton>
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
    </>
  );
}
