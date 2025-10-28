"use client";

import Image from "next/image";

export function GameSummaryCard({
  avatarUrl,
  username,
  theme,
  prizePool,
}: {
  avatarUrl: string;
  username: string;
  theme: string;
  prizePool: number;
}) {
  const formattedPrize = prizePool.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div
      className="
        relative flex flex-col box-border
        w-[361px] h-[151px]
        border border-[#FFC931] rounded-[16px]
        mx-auto
        mt-8
      "
    >
      {/* ─────────── Top Row: User joined ─────────── */}
      <div className="absolute top-[16px] left-[14px] flex flex-row items-center gap-[10px] w-[295px] h-[54px]">
        <div className="w-[54px] h-[54px] rounded-full overflow-hidden bg-[#D9D9D9]">
          <Image
            src={avatarUrl}
            alt="User avatar"
            width={54}
            height={54}
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-center items-start w-[159px] h-[48px]">
          <span className="font-edit-undo text-white text-[23px] leading-[130%]">
            {username}
          </span>
          <span className="font-display text-[#99A0AE] text-[14px] leading-[130%] tracking-[-0.03em]">
            has joined the next game
          </span>
        </div>
      </div>

      {/* ─────────── Bottom Row: Prize Pool + Theme ─────────── */}
      <div className="absolute bottom-[15px] left-[15px] flex flex-row items-center gap-[12px]">
        {/* Prize Pool */}
        <div className="flex flex-row items-center justify-center gap-[8.5px] w-[87.79px] h-[32px]">
          <Image
            src="/images/illustrations/money-stack.svg"
            alt="Prize icon"
            width={27.25}
            height={28.44}
            className="object-contain"
          />
          <div className="flex flex-col justify-center items-start w-[52px] h-[32px]">
            <span className="font-brockmann text-[#99A0AE] text-[11.38px] leading-[130%] tracking-[-0.03em]">
              Prize pool
            </span>
            <span className="font-edit-undo text-white text-[17.07px] leading-[100%]">
              {formattedPrize}
            </span>
          </div>
        </div>

        {/* Theme */}
        <div className="flex flex-row items-center justify-center gap-[8.5px] w-[106.65px] h-[32px]">
          <Image
            src={`/images/illustrations/theme-${theme}.svg`}
            alt="Football icon"
            width={29.11}
            height={28.43}
            className="object-contain"
          />
          <div className="flex flex-col justify-center items-start w-[69px] h-[32px]">
            <span className="font-brockmann text-[#99A0AE] text-[11.38px] leading-[130%] tracking-[-0.03em]">
              Theme
            </span>
            <span className="font-edit-undo text-white text-[17.07px] leading-[100%]">
              {theme.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
