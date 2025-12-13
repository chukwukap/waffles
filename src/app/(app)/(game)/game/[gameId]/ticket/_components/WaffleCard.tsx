"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/miniapp-sdk";
import { notify } from "@/components/ui/Toaster";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { env } from "@/lib/env";
import { USDC_ADDRESS_BASE_MAINNET } from "@/lib/constants";

// ERC20 transfer ABI for USDC payments
const USDC_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

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
  fid?: number; // Optional, kept for backwards compat but not used
  gameId: number;
}) => {
  const router = useRouter();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Basic wagmi hooks for direct transaction
  const { writeContract, isPending: isWritePending } = useWriteContract();

  // Track transaction confirmation (used for paid tickets flow)
  useWaitForTransactionReceipt({ hash: txHash });

  const submitTicketPurchase = useCallback(async (hash?: string) => {
    setIsPurchasing(true);
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
        throw new Error(errorData.error || "Failed to purchase ticket");
      }

      await res.json(); // Consume response
      notify.success("Ticket purchased successfully!");

      // Refresh the page to show success state
      router.refresh();
    } catch (error) {
      console.error("[WaffleCard] Purchase failed:", error);
      notify.error(error instanceof Error ? error.message : "Failed to purchase ticket");
    } finally {
      setIsPurchasing(false);
    }
  }, [gameId, router]);

  // Submit to server when we have the tx hash - using the memoized function
  useEffect(() => {
    if (txHash && !isPurchasing) {
      submitTicketPurchase(txHash);
    }
  }, [txHash, isPurchasing, submitTicketPurchase]);

  const handlePurchase = () => {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎟️ FREE TICKETS MODE: Skip wallet transaction for testing
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const FREE_TICKETS_MODE = true; // Set to false to require payment

    if (FREE_TICKETS_MODE) {
      notify.info("Creating your free ticket...");
      submitTicketPurchase();
      return;
    }
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Normal payment flow
    try {
      writeContract(
        {
          address: USDC_ADDRESS_BASE_MAINNET as `0x${string}`,
          abi: USDC_TRANSFER_ABI,
          functionName: "transfer",
          args: [
            env.nextPublicTreasuryWallet as `0x${string}`,
            parseUnits(price.toString(), 6),
          ],
        },
        {
          onSuccess: (hash) => {
            setTxHash(hash);
            notify.info("Transaction submitted. Waiting for confirmation...");
          },
          onError: (error) => {
            console.error("[WaffleCard] Transaction failed:", error);
            notify.error("Transaction failed. Please try again.");
          },
        }
      );
    } catch (err) {
      console.error("[WaffleCard] Failed to initiate purchase:", err);
      notify.error("An unexpected error occurred.");
    }
  };

  const isProcessing = isWritePending || isPurchasing;

  return (
    <div
      className="box-border flex flex-col justify-center items-center gap-6 p-5 px-3 border border-white/10 rounded-2xl w-full max-w-lg h-auto min-h-[207px]"
    >
      <div className="flex flex-row justify-center items-center gap-4 sm:gap-6 w-full">
        <div className="flex-1 flex justify-center">
          <InfoBox
            iconUrl="/images/illustrations/seats.svg"
            label="Spots"
            value={`${spots}/${maxPlayers}`}
          />
        </div>
        <div className="flex-1 flex justify-center">
          <InfoBox
            iconUrl="/images/illustrations/money-stack.svg"
            label="Prize pool"
            value={`$${prizePool}`}
          />
        </div>
      </div>

      <div className="w-full max-w-lg">
        <FancyBorderButton
          disabled={isProcessing}
          onClick={handlePurchase}
        >
          {isProcessing
            ? "PROCESSING..."
            : `BUY WAFFLE $${price}`}
        </FancyBorderButton>
      </div>
    </div>
  );
};
