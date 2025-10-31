"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { GameSummaryCard } from "./GameSummary";
import Link from "next/link";

type ShareViewProps = {
  gameTitle: string;
  theme: string;
  username: string;
  avatarUrl: string;
  startTime: Date;
  prizePool: number | null;
  onShare: () => void;
  gameId: number;
};

export function Share({
  theme,
  username,
  avatarUrl,
  prizePool,
  gameId,
  onShare,
}: ShareViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col items-center px-5 pb-10">
      <Image
        src="/images/illustrations/waffles.svg"
        alt="Pixel waffle"
        width={228}
        height={100}
        priority
        className="mb-5 h-auto w-[228px]"
      />
      <h1
        className="text-foreground text-center font-edit-undo"
        style={{
          fontSize: "42px",
          lineHeight: "0.92",
          letterSpacing: "-0.03em",
        }}
      >
        WAFFLE SECURED!
      </h1>
      <p className="mt-3 text-center text-base font-display text-[#99A0AE]">
        {" "}
        You&apos;re in. See you Friday.
      </p>
      <GameSummaryCard
        avatarUrl={avatarUrl}
        username={username}
        theme={theme}
        prizePool={prizePool ?? 0}
      />
      <button
        onClick={onShare}
        className={cn(
          "mt-8 w-full rounded-[14px] bg-white px-6 py-4 text-center font-edit-undo text-2xl text-[#FB72FF]",
          "border-r-[5px] border-b-[5px] border-[#FB72FF] transition active:translate-x-[2px] active:translate-y-[2px]"
        )}
      >
        SHARE TICKET
      </button>{" "}
      <button className="mt-6 text-sm font-edit-undo uppercase text-[#00CFF2] transition hover:text-[#33defa]">
        <Link href={`/game/${gameId}`}>BACK TO HOME</Link>
      </button>
    </div>
  );
}
