"use client";

import { WaffleIcon, FlashIcon, CupIcon } from "@/components/icons";
import { Spinner } from "@/components/ui/spinner";
import { notify } from "@/components/ui/Toaster";
import { GameHistoryEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import sdk from "@farcaster/miniapp-sdk";
import React, { useState } from "react";
import Link from "next/link";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { useRouter } from "next/navigation";

interface GameHistoryItemProps {
  game: GameHistoryEntry;
}

export default function GameHistoryItem({ game }: GameHistoryItemProps) {
  const router = useRouter();
  const [isClaiming, setIsClaiming] = useState(false);
  const [localClaimedAt, setLocalClaimedAt] = useState<Date | null>(null);

  const formattedWinnings = `$${game.winnings.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const hasWinnings = game.winnings > 0;
  const isClaimed = !!game.claimedAt || !!localClaimedAt;
  const isEligibleToClaim = hasWinnings && !isClaimed;

  const handleClaim = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isClaiming || !isEligibleToClaim) return;

    setIsClaiming(true);
    try {
      const res = await sdk.quickAuth.fetch("/api/v1/prizes/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to claim prize");
      }

      const data = await res.json();
      setLocalClaimedAt(new Date(data.claimedAt));
      notify.success("Prize Claimed!");
      router.refresh();
    } catch (error) {
      console.error("Claim error:", error);
      notify.error(error instanceof Error ? error.message : "Failed to claim prize");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Link
      href={`/profile/history/${game.id}`}
      className={cn(
        "relative flex flex-col justify-between w-full",
        "bg-[#FFFFFF08] border border-[#FFFFFF14] rounded-[16px] p-[12px]",
        "transition-all hover:bg-[#FFFFFF10]",
        isEligibleToClaim ? "h-[105px]" : "h-[64px]"
      )}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left: Icon + Info */}
        <div className="flex items-center gap-3">
          {/* Game Icon / Avatar Placeholder */}
          <div className="flex items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-[#FFFFFF1A] border border-white/10">
            <WaffleIcon className="w-5 h-5 text-[#FFC931]" />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="font-body text-[16px] leading-none text-white tracking-tight">
              {game.name}
            </span>
            <div className="flex items-center gap-1">
              <FlashIcon className="w-3 h-3 text-[#FFC931]" />
              <span className="font-display font-medium text-[12px] text-[#99A0AE]">
                {game.score.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Amount (always visible here for non-claim state, or if we want it top right) */}
        {!isEligibleToClaim && (
          <span
            className={cn(
              "font-body text-[20px] leading-none tracking-[-0.02em]",
              isClaimed && hasWinnings ? "text-[#14B985]" : "text-white"
            )}
          >
            {formattedWinnings}
          </span>
        )}

        {/* For eligible state, maybe show amount on top right too? Image 1 shows amount on right. */}
        {isEligibleToClaim && (
          <span className="font-body text-[20px] leading-none tracking-[-0.02em] text-[#14B985]">
            {formattedWinnings}
          </span>
        )}
      </div>

      {/* Bottom: Claim Button if eligible */}
      {isEligibleToClaim && (
        <div className="w-full mt-auto">
          {isClaiming ? (
            <div className="flex items-center justify-center w-full h-[34px] bg-white/5 rounded-full">
              <Spinner className="w-4 h-4 text-white/60" />
            </div>
          ) : (
            <FancyBorderButton
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-[92px] h-[29px] text-[12px] border-[#14B985] text-[#14B985] ml-12 px-0.5"
              fullWidth={false}
            >
              <CupIcon className="mr-1" />
              <span>CLAIM</span>
            </FancyBorderButton>
          )}
        </div>
      )}
    </Link>
  );
}