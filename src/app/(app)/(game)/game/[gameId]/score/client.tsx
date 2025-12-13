"use client";

import { use } from "react";
import WinningsCard from "../_component/WinningsCard";
import Leaderboard from "./_components/Leaderboard";
import Image from "next/image";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { FlashIcon } from "@/components/icons";
import { ScorePagePayload } from "./page";
import Link from "next/link";

export default function ScorePageClient({
  scorePayloadPromise,
}: {
  scorePayloadPromise: Promise<ScorePagePayload | null>;
}) {
  const scorePayload = use(scorePayloadPromise);

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
        width={228}
        height={132}
      />

      <h1 className="font-body text-[44px] leading-none">GAME OVER</h1>
      <p className="text-[#99A0AE] text-[16px] font-display mt-1 capitalize">
        {category.toLowerCase()}
      </p>

      <WinningsCard
        winnings={winnings}
        score={score}
        rank={rank}
        pfpUrl={userInfo.pfpUrl} // CHANGED: from avatarUrl
        username={userInfo.username}
      />

      <p className="text-white/80 text-[12px] my-1 flex items-center gap-2 font-display">
        <FlashIcon className="w-[16px] h-[16px] text-[#FFC931]" />
        You finished faster than {percentile}% of your friends
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
  );
}
