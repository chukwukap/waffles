"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/miniapp-sdk";
import { notify } from "@/components/ui/Toaster";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import {
  useBuyTicket,
  useApproveToken,
  useTokenAllowance,
} from "@/hooks/useWaffleGame";
import { TOKEN_CONFIG } from "@/lib/contracts/config";

const InfoBox = ({
  iconUrl,
  label,
  value,
}: {
  iconUrl: string;
  label: string;
  value: string;
}) => (
  <div
    className="flex flex-col justify-center items-center gap-1"
    style={{ width: "156px", height: "89px" }}
  >
    <Image
      src={iconUrl}
      width={40}
      height={40}
      alt={label}
      className="h-[40px]"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
    <div className="flex flex-col justify-center items-center">
      <span className="font-display text-[16px] font-medium leading-[130%] tracking-[-0.03em] text-[#99A0AE]">
        {label}
      </span>
      <span className="font-body text-[24px] font-normal leading-[100%] text-white">
        {value}
      </span>
    </div>
  </div>
);

export const WaffleCard = ({
  spots,
  prizePool,
  price,
  maxPlayers,
  gameId,
}: {
  spots: number;
  prizePool: number;
  price: number;
  maxPlayers: number;
  fid?: number;
  gameId: number;
}) => {
  const router = useRouter();
  const { address } = useAccount();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState<"idle" | "approving" | "buying">("idle");

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎟️ FREE TICKETS MODE: Set to false to require on-chain payment
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const FREE_TICKETS_MODE = true;

  // Contract hooks
  const {
    buyTicket,
    hash: buyHash,
    isPending: isBuying,
    isConfirming: isBuyConfirming,
    isSuccess: isBuySuccess,
    error: buyError,
  } = useBuyTicket();

  const {
    approve,
    isPending: isApproving,
    isConfirming: isApproveConfirming,
    isSuccess: isApproveSuccess,
    error: approveError,
  } = useApproveToken();

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(address);

  // Calculate required amount
  const requiredAmount = parseUnits(price.toString(), TOKEN_CONFIG.decimals);
  const hasEnoughAllowance = allowance && allowance >= requiredAmount;

  // Sync purchase with backend after successful on-chain tx
  const syncWithBackend = useCallback(async (hash?: string) => {
    try {
      const res = await sdk.quickAuth.fetch("/api/v1/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          txHash: hash || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to sync ticket");
      }

      notify.success("Ticket purchased successfully!");
      router.refresh();
    } catch (error) {
      console.error("[WaffleCard] Sync failed:", error);
      notify.error(error instanceof Error ? error.message : "Failed to sync ticket");
    } finally {
      setIsPurchasing(false);
      setPurchaseStep("idle");
    }
  }, [gameId, router]);

  // Handle approval success - proceed to buy
  useEffect(() => {
    if (isApproveSuccess && purchaseStep === "approving") {
      refetchAllowance();
      setPurchaseStep("buying");
      buyTicket(BigInt(gameId), price.toString());
    }
  }, [isApproveSuccess, purchaseStep, buyTicket, gameId, price, refetchAllowance]);

  // Handle buy success - sync with backend
  useEffect(() => {
    if (isBuySuccess && buyHash && purchaseStep === "buying") {
      syncWithBackend(buyHash);
    }
  }, [isBuySuccess, buyHash, purchaseStep, syncWithBackend]);

  // Handle errors
  useEffect(() => {
    if (approveError) {
      console.error("Approve error:", approveError);
      notify.error("Failed to approve tokens");
      setIsPurchasing(false);
      setPurchaseStep("idle");
    }
  }, [approveError]);

  useEffect(() => {
    if (buyError) {
      console.error("Buy error:", buyError);
      notify.error("Failed to buy ticket");
      setIsPurchasing(false);
      setPurchaseStep("idle");
    }
  }, [buyError]);

  const handlePurchase = async () => {
    // Free tickets mode - bypass contract
    if (FREE_TICKETS_MODE) {
      setIsPurchasing(true);
      notify.info("Creating your free ticket...");
      await syncWithBackend();
      return;
    }

    // Production flow: Check wallet connection
    if (!address) {
      notify.error("Please connect your wallet");
      return;
    }

    setIsPurchasing(true);

    // Check if we need to approve first
    if (!hasEnoughAllowance) {
      setPurchaseStep("approving");
      notify.info("Approving USDC...");
      approve(price.toString());
    } else {
      setPurchaseStep("buying");
      notify.info("Purchasing ticket...");
      buyTicket(BigInt(gameId), price.toString());
    }
  };

  const isLoading = isPurchasing || isApproving || isApproveConfirming || isBuying || isBuyConfirming;

  const getButtonText = () => {
    if (isApproving || isApproveConfirming) return "Approving...";
    if (isBuying || isBuyConfirming) return "Purchasing...";
    if (isPurchasing) return "Processing...";
    return "BUY WAFFLE";
  };

  return (
    <div
      className="flex flex-col items-center gap-6 px-3 py-4 rounded-[24px] border border-[#FFFFFF14] bg-[#FFFFFF08]"
      style={{ width: "100%", maxWidth: "361px" }}
    >
      {/* Waffle Image */}
      <div className="relative w-[200px] h-[116px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
        <Image
          src="/images/illustrations/waffles.svg"
          alt="Waffle"
          fill
          priority
          className="object-contain"
        />
      </div>

      {/* Info Row */}
      <div className="flex justify-center gap-3 w-full">
        <InfoBox
          iconUrl="/images/icons/users.svg"
          label="Spots Left"
          value={`${Math.max(0, spots)}/${maxPlayers}`}
        />
        <InfoBox
          iconUrl="/images/icons/prize.svg"
          label="Prize Pool"
          value={`$${prizePool.toLocaleString()}`}
        />
      </div>

      {/* Purchase Button */}
      <FancyBorderButton
        onClick={handlePurchase}
        disabled={isLoading || spots <= 0}
        fullWidth
        className="h-[52px]"
      >
        <span className="font-body text-[18px]">
          {spots <= 0 ? "SOLD OUT" : getButtonText()}
        </span>
        {spots > 0 && !isLoading && (
          <span className="ml-2 font-display text-[14px] opacity-70">
            ${price}
          </span>
        )}
      </FancyBorderButton>
    </div>
  );
};
