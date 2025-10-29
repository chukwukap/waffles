"use client";

import Image from "next/image";
import { cn, getWeekdayString } from "@/lib/utils";
import { GameSummaryCard } from "./GameSummary";
import Link from "next/link";

// Props for the main Share component
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

/**
 * Share component displayed after successfully purchasing a ticket.
 * It's purely presentational, receiving all data and actions via props.
 */
export function Share({
  gameTitle,
  theme,
  username,
  avatarUrl,
  prizePool,
  startTime,
  gameId,
  onShare,
}: ShareViewProps) {
  console.log("avatarUrl", startTime);
  console.log("theme", theme);
  console.log("username", username);
  console.log("avatarUrl", avatarUrl);
  console.log("prizePool", prizePool);
  console.log("onShare", onShare);
  return (
    // Outer container ensures full viewport height and applies noise background
    <div className="min-h-[100dvh] w-full z-50">
      {" "}
      {/* Centered content area with padding */}
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[420px] flex-col items-center px-5 pb-[calc(env(safe-area-inset-bottom)+48px)] pt-14">
        {" "}
        {/* Waffle ticket illustration */}
        <Image
          src="/images/illustrations/waffle-ticket.png"
          alt="Pixel waffle"
          width={228}
          height={132}
          priority
          className="mb-8 h-auto w-[228px]"
        />
        {/* Main heading */}
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
        {/* Sub-heading */}
        <p className="mt-3 text-center text-base font-display text-[#99A0AE]">
          {" "}
          You&apos;re in for {gameTitle}. See you{" "}
          {getWeekdayString(new Date(startTime).getDay())}
        </p>
        <GameSummaryCard
          avatarUrl={avatarUrl}
          username={username}
          theme={theme}
          prizePool={prizePool ?? 0}
        />
        {/* Share Button */}
        <button
          onClick={onShare}
          className={cn(
            "mt-8 w-full rounded-[14px] bg-white px-6 py-4 text-center font-edit-undo text-2xl text-[#FB72FF]",
            "border-r-[5px] border-b-[5px] border-[#FB72FF] transition active:translate-x-[2px] active:translate-y-[2px]"
          )}
        >
          SHARE TICKET
        </button>{" "}
        {/* Back to Home Button */}
        <button className="mt-6 text-sm font-edit-undo uppercase text-[#00CFF2] transition hover:text-[#33defa]">
          <Link href={`/game/${gameId}`}>BACK TO HOME</Link>
        </button>
      </div>
    </div>
  );
}
