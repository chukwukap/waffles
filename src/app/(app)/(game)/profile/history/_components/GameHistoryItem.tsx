"use client";

import { WaffleIcon, FlashIcon, CupIcon } from "@/components/icons";
import { Spinner } from "@/components/ui/spinner";
import { notify } from "@/components/ui/Toaster";
import { GameHistoryEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import sdk from "@farcaster/miniapp-sdk";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { useRouter } from "next/navigation";
import { useClaimPrize, useHasClaimed } from "@/hooks/useWaffleGame";
import { useAccount } from "wagmi";

interface GameHistoryItemProps {
  game: GameHistoryEntry;
}

export default function GameHistoryItem({ game }: GameHistoryItemProps) {
  const router = useRouter();
  const { address } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStep, setClaimStep] = useState<"idle" | "fetching_proof" | "claiming">("idle");
  const [localClaimedAt, setLocalClaimedAt] = useState<Date | null>(null);

  // On-chain claim hook
  const {
    claimPrize,
    hash: claimHash,
    isPending: isClaimPending,
    isConfirming: isClaimConfirming,
    isSuccess: isClaimSuccess,
    error: claimError,
  } = useClaimPrize();

  // Check if already claimed on-chain
  const { data: hasClaimedOnChain } = useHasClaimed(
    BigInt(game.id),
    address as `0x${string}` | undefined
  );

  const formattedWinnings = `$${game.winnings.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const hasWinnings = game.winnings > 0;
  const isClaimed = !!game.claimedAt || !!localClaimedAt || !!hasClaimedOnChain;
  const isEligibleToClaim = hasWinnings && !isClaimed;

  // Handle successful on-chain claim
  useEffect(() => {
    if (isClaimSuccess && claimHash && claimStep === "claiming") {
      // Sync with backend after on-chain success
      syncWithBackend();
    }
  }, [isClaimSuccess, claimHash, claimStep]);

  // Handle claim error
  useEffect(() => {
    if (claimError) {
      console.error("Claim error:", claimError);
      notify.error("Failed to claim prize on-chain");
      setIsClaiming(false);
      setClaimStep("idle");
    }
  }, [claimError]);

  const syncWithBackend = async () => {
    try {
      const res = await sdk.quickAuth.fetch("/api/v1/prizes/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id }),
      });

      if (!res.ok) {
        // Backend sync failed but on-chain succeeded - still show as claimed
        console.warn("Backend sync failed, but on-chain claim succeeded");
      }

      const data = await res.json();
      setLocalClaimedAt(new Date(data.claimedAt || Date.now()));
      notify.success("Prize Claimed!");
      router.refresh();
    } catch (error) {
      console.error("Sync error:", error);
      // Still mark as claimed since on-chain succeeded
      setLocalClaimedAt(new Date());
      notify.success("Prize Claimed!");
    } finally {
      setIsClaiming(false);
      setClaimStep("idle");
    }
  };

  const handleClaim = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isClaiming || !isEligibleToClaim) return;

    // For on-chain claiming, we need a wallet
    if (!address) {
      // Fallback to API-only claim if no wallet
      setIsClaiming(true);
      await syncWithBackend();
      return;
    }

    setIsClaiming(true);
    setClaimStep("fetching_proof");

    try {
      // Fetch Merkle proof from API
      const res = await sdk.quickAuth.fetch(`/api/v1/games/${game.id}/merkle-proof`);

      if (!res.ok) {
        const errorData = await res.json();
        // If not a winner on-chain, fall back to API-only claim
        if (errorData.code === "NOT_WINNER" || errorData.code === "GAME_NOT_ENDED") {
          await syncWithBackend();
          return;
        }
        throw new Error(errorData.error || "Failed to get Merkle proof");
      }

      const proofData = await res.json();

      // Call on-chain claimPrize
      setClaimStep("claiming");
      notify.info("Claiming prize on-chain...");
      claimPrize(
        BigInt(game.id),
        BigInt(proofData.amount),
        proofData.proof as `0x${string}`[]
      );
    } catch (error) {
      console.error("Claim error:", error);
      notify.error(error instanceof Error ? error.message : "Failed to claim prize");
      setIsClaiming(false);
      setClaimStep("idle");
    }
  };

  const isLoading = isClaiming || isClaimPending || isClaimConfirming;

  const getButtonText = () => {
    if (claimStep === "fetching_proof") return "...";
    if (isClaimPending || isClaimConfirming) return "...";
    return "CLAIM";
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

        {/* Right: Amount */}
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

        {isEligibleToClaim && (
          <span className="font-body text-[20px] leading-none tracking-[-0.02em] text-[#14B985]">
            {formattedWinnings}
          </span>
        )}
      </div>

      {/* Bottom: Claim Button if eligible */}
      {isEligibleToClaim && (
        <div className="w-full mt-auto">
          {isLoading ? (
            <div className="flex items-center justify-center w-full h-[34px] bg-white/5 rounded-full">
              <Spinner className="w-4 h-4 text-white/60" />
            </div>
          ) : (
            <FancyBorderButton
              onClick={handleClaim}
              disabled={isLoading}
              className="w-[92px] h-[29px] text-[12px] border-[#14B985] text-[#14B985] ml-12 px-0.5"
              fullWidth={false}
            >
              <CupIcon className="mr-1" />
              <span>{getButtonText()}</span>
            </FancyBorderButton>
          )}
        </div>
      )}
    </Link>
  );
}