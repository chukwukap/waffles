"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/miniapp-sdk";
import { notify } from "@/components/ui/Toaster";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { useAccount, useSignTypedData } from "wagmi";
import { parseUnits } from "viem";
import {
  useBuyTicketWithPermit,
  usePermitNonce,
  USDC_PERMIT_DOMAIN,
  PERMIT_TYPES,
  splitSignature,
} from "@/hooks/useWaffleGame";
import { WAFFLE_GAME_CONFIG, TOKEN_CONFIG } from "@/lib/contracts/config";

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

  // Permit hooks
  const { signTypedDataAsync } = useSignTypedData();
  const { data: nonce, refetch: refetchNonce } = usePermitNonce(address);
  const {
    buyWithPermit,
    hash: buyHash,
    isPending: isBuying,
    isConfirming: isBuyConfirming,
    isSuccess: isBuySuccess,
    error: buyError,
  } = useBuyTicketWithPermit();

  // Sync with backend after successful purchase
  const syncWithBackend = useCallback(
    async (hash: string) => {
      try {
        const res = await sdk.quickAuth.fetch("/api/v1/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameId,
            txHash: hash,
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
        notify.error(
          error instanceof Error ? error.message : "Failed to sync ticket"
        );
      } finally {
        setIsPurchasing(false);
      }
    },
    [gameId, router]
  );

  // Handle successful on-chain purchase
  useEffect(() => {
    if (isBuySuccess && buyHash) {
      syncWithBackend(buyHash);
    }
  }, [isBuySuccess, buyHash, syncWithBackend]);

  // Handle purchase error
  useEffect(() => {
    if (buyError) {
      console.error("Purchase error:", buyError);
      notify.error("Failed to purchase ticket");
      setIsPurchasing(false);
    }
  }, [buyError]);

  /**
   * Purchase flow using ERC20 Permit:
   * 1. Sign permit off-chain (no gas)
   * 2. Submit buyTicketWithPermit transaction (one tx)
   */
  const handlePurchase = async () => {
    if (!address) {
      notify.error("Please connect your wallet");
      return;
    }

    setIsPurchasing(true);

    // Refetch nonce to ensure it's current
    const { data: currentNonce } = await refetchNonce();
    if (currentNonce === undefined) {
      notify.error("Failed to get permit nonce");
      setIsPurchasing(false);
      return;
    }

    try {
      // Set permit deadline to 10 minutes from now
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const amountInUnits = parseUnits(price.toString(), TOKEN_CONFIG.decimals);

      // Sign the permit
      notify.info("Please sign the permit...");
      const signature = await signTypedDataAsync({
        domain: USDC_PERMIT_DOMAIN,
        types: PERMIT_TYPES,
        primaryType: "Permit",
        message: {
          owner: address,
          spender: WAFFLE_GAME_CONFIG.address,
          value: amountInUnits,
          nonce: currentNonce,
          deadline,
        },
      });

      // Split signature into v, r, s
      const { v, r, s } = splitSignature(signature);

      // Submit buyTicketWithPermit transaction
      notify.info("Purchasing ticket...");
      buyWithPermit(BigInt(gameId), price.toString(), deadline, v, r, s);
    } catch (error) {
      console.error("Permit signing failed:", error);
      if ((error as Error).message?.includes("rejected")) {
        notify.error("Signature rejected");
      } else {
        notify.error("Failed to sign permit");
      }
      setIsPurchasing(false);
    }
  };

  const isLoading = isPurchasing || isBuying || isBuyConfirming;

  const getButtonText = () => {
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
