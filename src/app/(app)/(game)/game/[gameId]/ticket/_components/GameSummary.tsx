"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Image from "next/image";

export function GameSummaryCard({
  theme,
  prizePool,
}: {
  theme: string;
  prizePool: number;
}) {
  const { context: miniKitContext } = useMiniKit();
  const username = miniKitContext?.user?.username;
  const avatarUrl = miniKitContext?.user?.pfpUrl;
  const formattedPrize = prizePool.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div
      className="
        relative flex flex-col box-border
        w-full max-w-lg h-[151px]
        border border-[#FFC931] rounded-[16px]
        mx-auto
        mt-8
      "
    >
      {/* ─────────── Top Row: User joined ─────────── */}
      <div className="absolute top-[16px] left-[14px] flex flex-row items-center gap-[10px] w-full max-w-[295px] h-[54px]">
        <div className="w-[54px] h-[54px] rounded-full overflow-hidden bg-[#D9D9D9] shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="User avatar"
              width={54}
              height={54}
              className="object-cover"
            />
          ) : (
            <div className="w-[54px] h-[54px] rounded-full overflow-hidden bg-[#D9D9D9] flex items-center justify-center">
              <span className="font-body text-white text-[23px] leading-[130%]">
                {username?.[0]?.toUpperCase() ?? "•"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center items-start w-auto h-[48px]">
          <span className="font-body text-white text-[23px] leading-[130%] truncate max-w-[200px]">
            {username}
          </span>
          <span className="font-display text-[#99A0AE] text-[14px] leading-[130%] tracking-[-0.03em]">
            has joined the next game
          </span>
        </div>
      </div>

      {/* ─────────── Bottom Row: Prize Pool + Theme ─────────── */}
      <div className="absolute bottom-[15px] left-[15px] flex flex-row items-center gap-[12px] flex-wrap">
        {/* Prize Pool */}
        <div className="flex flex-row items-center justify-center gap-[8.5px] h-[32px]">
          <Image
            src="/images/illustrations/money-stack.svg"
            alt="Prize icon"
            width={27.25}
            height={28.44}
            className="object-contain"
          />
          <div className="flex flex-col justify-center items-start h-[32px]">
            <span className="font-display text-[#99A0AE] text-[11.38px] leading-[130%] tracking-[-0.03em]">
              Prize pool
            </span>
            <span className="font-body text-white text-[17.07px] leading-[100%]">
              {formattedPrize}
            </span>
          </div>
        </div>

        {/* Theme */}
        <div className="flex flex-row items-center justify-center gap-[8.5px] h-[32px]">
          <Image
            src={`/images/themes/${theme}.svg`}
            alt="Football icon"
            width={29.11}
            height={28.43}
            className="object-contain"
          />
          <div className="flex flex-col justify-center items-start h-[32px]">
            <span className="font-display text-[#99A0AE] text-[11.38px] leading-[130%] tracking-[-0.03em]">
              Theme
            </span>
            <span className="font-body text-white text-[17.07px] leading-[100%]">
              {theme.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
