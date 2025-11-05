"use client";

import { use } from "react";
import WinningsCard from "./WinningsCard";
import Leaderboard from "./Leaderboard";
import Image from "next/image";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { FlashIcon } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { ScorePagePayload } from "../page";

export default function ScorePageClient({
  scorePayloadPromise,
}: {
  scorePayloadPromise: Promise<ScorePagePayload | null>;
}) {
  const scorePayload = use(scorePayloadPromise);

  const router = useRouter();
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;

  if (!scorePayload) {
    return (
      <div className="flex flex-col text-white items-center justify-center min-h-full">
        <p className="text-lg">Score not found.</p>
      </div>
    );
  }

  const { category, winnings, score, rank, percentile, leaderboard, userInfo } =
    scorePayload;

  return (
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
          onClick={() => router.push(`/lobby?fid=${fid}`)}
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
  );
}
