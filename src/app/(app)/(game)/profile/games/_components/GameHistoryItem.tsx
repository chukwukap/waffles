"use client";

import { WaffleIcon, FlashIcon, CupIcon } from "@/components/icons";
import { GameHistoryEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface GameHistoryItemProps {
  game: GameHistoryEntry;
}

export default function GameHistoryItem({ game }: GameHistoryItemProps) {
  const formattedWinnings = `$${game.winnings.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const hasWinnings = game.winnings > 0;
  const isClaimed = !!game.claimedAt;
  const isEligibleToClaim = hasWinnings && !isClaimed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={`/game/${game.id}/result`}
        className={cn(
          "relative flex flex-col w-full",
          "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-3",
          "transition-all hover:bg-[rgba(255,255,255,0.05)]",
          isEligibleToClaim ? "gap-3" : ""
        )}
      >
        <div className="flex items-center justify-between w-full">
          {/* Left: Icon + Info */}
          <div className="flex items-center gap-2">
            {/* Waffle Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(255,255,255,0.1)]">
              <WaffleIcon className="w-4 h-4" />
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-body text-[20px] leading-none text-white">
                #Waffles #{game.id.toString().padStart(3, "0")}
              </span>
              <div className="flex items-center gap-1">
                <FlashIcon className="w-4 h-4 text-[#FFC931]" />
                <span className="font-display font-medium text-[12px] leading-[14px] tracking-[-0.03em] text-white">
                  {game.score.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Amount */}
          <span
            className={cn(
              "font-display font-medium text-[16px] leading-[19px] tracking-[-0.03em]",
              hasWinnings ? "text-[#14B985]" : "text-[#14B985]"
            )}
          >
            {formattedWinnings}
          </span>
        </div>

        {/* Bottom: Claim Button if eligible - navigates to result page */}
        {isEligibleToClaim && (
          <motion.div
            className="flex items-center gap-1.5 px-3 py-1 bg-white border-r-[3px] border-b-[3px] border-[#14B985] rounded-lg w-fit ml-12"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98, y: 1 }}
          >
            <CupIcon className="w-4 h-4 text-[#14B985]" />
            <span className="font-body text-[18px] leading-[115%] tracking-[-0.02em] text-[#14B985]">
              CLAIM
            </span>
          </motion.div>
        )}
      </Link>
    </motion.div>
  );
}