"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAccount, useConnect } from "wagmi";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

import {
  useTicketPurchase,
  getPurchaseButtonText,
} from "@/hooks/useTicketPurchase";

// ==========================================
// CONSTANTS
// ==========================================

const TIER_GRADIENTS = [
  {
    selected:
      "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(211,77,25,0.52) 100%)",
    unselected:
      "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(211,77,25,0.2) 100%)",
  },
  {
    selected:
      "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.52) 100%)",
    unselected:
      "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 100%)",
  },
  {
    selected:
      "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,201,49,0.52) 100%)",
    unselected:
      "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,201,49,0.12) 100%)",
  },
];

// ==========================================
// TYPES
// ==========================================

interface BuyTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: number;
  onchainId: `0x${string}` | null;
  theme: string;
  themeIcon?: string;
  tierPrices: number[];
  prizePool?: number;
  username?: string;
  userAvatar?: string;
  onPurchaseSuccess?: () => void;
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function BuyTicketModal({
  isOpen,
  onClose,
  gameId,
  onchainId,
  theme,
  themeIcon,
  tierPrices,
  prizePool = 0,
  username = "Player",
  userAvatar,
  onPurchaseSuccess,
}: BuyTicketModalProps) {
  const { context } = useMiniKit();
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [selectedTier, setSelectedTier] = useState(0);

  // Derived display values
  const displayUsername =
    username !== "Player" ? username : context?.user?.username || "Player";
  const displayAvatar = userAvatar || context?.user?.pfpUrl;
  const selectedPrice = tierPrices[selectedTier] ?? 0;
  const potentialPayout = Math.round(selectedPrice * 21.1);

  // Use the ticket purchase hook
  const {
    step,
    isLoading,
    isSuccess,
    isError,
    hasTicket,
    hasSufficientBalance,
    purchase,
    reset,
  } = useTicketPurchase(gameId, onchainId, selectedPrice, onPurchaseSuccess);

  // Auto-connect wallet when modal opens
  useEffect(() => {
    if (isOpen && !isConnected && connectors[0]) {
      connect({ connector: connectors[0] });
    }
  }, [isOpen, isConnected, connect, connectors]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Computed states
  const isPurchased = hasTicket || isSuccess;
  const buttonText = getPurchaseButtonText(step, selectedPrice);
  const isButtonDisabled =
    isLoading || !onchainId || !hasSufficientBalance || isPurchased;

  // Handle purchase button click
  const handlePurchase = () => {
    if (isError) {
      reset();
    } else {
      purchase();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[20px] overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #1E1E1E 0%, #000000 100%)",
          maxHeight: "85dvh",
        }}
      >
        {/* Header with Grabber */}
        <div
          className="flex justify-center items-center shrink-0 w-full"
          style={{
            height: "clamp(48px, 8vh, 60px)",
            padding: "2px 2px 12px",
            background: "#191919",
            borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
          }}
        >
          <div
            className="w-9 h-[5px] rounded-full cursor-pointer"
            style={{ background: "rgba(255, 255, 255, 0.4)" }}
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <div
          className="flex-1 flex flex-col items-center px-4 overflow-y-auto"
          style={{
            paddingBottom: "clamp(16px, 4vh, 32px)",
            gap: "clamp(12px, 3vh, 20px)",
          }}
        >
          {isPurchased ? (
            // ==========================================
            // SUCCESS VIEW
            // ==========================================
            <>
              {/* User Avatar + Info */}
              <div
                className="flex flex-col items-center w-full"
                style={{
                  gap: "clamp(8px, 2vh, 12px)",
                  paddingTop: "clamp(12px, 3vh, 20px)",
                }}
              >
                {displayAvatar && (
                  <Image
                    src={displayAvatar}
                    alt="avatar"
                    width={80}
                    height={80}
                    className="rounded-full border-4 border-white/20"
                  />
                )}
                <span
                  className="font-body text-white"
                  style={{ fontSize: "clamp(18px, 4vw, 24px)" }}
                >
                  {displayUsername}
                </span>
              </div>

              {/* Prize Pool */}
              <div
                className="flex flex-col items-center w-full"
                style={{ gap: "8px" }}
              >
                <span
                  className="font-display text-white"
                  style={{
                    fontSize: "clamp(10px, 2vw, 12px)",
                    opacity: 0.6,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Playing for
                </span>
                <span
                  className="font-body"
                  style={{
                    fontSize: "clamp(40px, 10vw, 56px)",
                    color: "#14B985",
                    lineHeight: "100%",
                  }}
                >
                  ${prizePool}
                </span>
              </div>

              {/* Theme */}
              <div className="flex items-center gap-2.5">
                <span
                  className="font-body text-white"
                  style={{ fontSize: "clamp(24px, 5vw, 32px)" }}
                >
                  {theme.toUpperCase()}
                </span>
                {themeIcon && (
                  <Image
                    src={themeIcon}
                    alt={theme}
                    width={41}
                    height={40}
                    className="object-contain"
                    style={{
                      width: "clamp(32px, 6vw, 41px)",
                      height: "auto",
                    }}
                  />
                )}
              </div>

              {/* Close Button */}
              <div className="flex gap-3 w-full max-w-[361px] mt-4">
                <button
                  className="flex-1 flex items-center justify-center rounded-xl h-[54px]"
                  style={{
                    background: "rgba(255, 255, 255, 0.09)",
                    border: "2px solid rgba(255, 255, 255, 0.4)",
                  }}
                  onClick={onClose}
                >
                  <span
                    className="font-body uppercase text-white"
                    style={{ fontSize: "18px", letterSpacing: "-0.02em" }}
                  >
                    BACK TO HOME
                  </span>
                </button>
              </div>
            </>
          ) : (
            // ==========================================
            // PURCHASE VIEW
            // ==========================================
            <>
              {/* Theme Section */}
              <div
                className="flex flex-col items-center w-full"
                style={{
                  gap: "clamp(8px, 2vh, 12px)",
                  paddingTop: "clamp(12px, 3vh, 20px)",
                }}
              >
                <span
                  className="font-display text-white text-center"
                  style={{
                    fontSize: "clamp(12px, 2vw, 14px)",
                    opacity: 0.6,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Next game theme
                </span>
                <div className="flex items-center gap-2.5">
                  <span
                    className="font-body text-white"
                    style={{ fontSize: "clamp(24px, 5vw, 32px)" }}
                  >
                    {theme.toUpperCase()}
                  </span>
                  {themeIcon && (
                    <Image
                      src={themeIcon}
                      alt={theme}
                      width={41}
                      height={40}
                      className="object-contain"
                      style={{
                        width: "clamp(32px, 6vw, 41px)",
                        height: "auto",
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Choose Tier Title */}
              <h2
                className="font-body text-white text-center w-full"
                style={{
                  fontSize: "clamp(18px, 4vw, 22px)",
                  lineHeight: "92%",
                  letterSpacing: "-0.03em",
                }}
              >
                CHOOSE YOUR TICKET TIER
              </h2>

              {/* Tier Cards */}
              <div
                className="flex w-full max-w-[361px]"
                style={{ gap: "clamp(8px, 2vw, 14px)" }}
              >
                {tierPrices.map((price, index) => {
                  const gradient = TIER_GRADIENTS[index % TIER_GRADIENTS.length];
                  const isSelected = selectedTier === index;
                  return (
                    <button
                      key={price}
                      onClick={() => !isLoading && setSelectedTier(index)}
                      disabled={isLoading}
                      className="flex flex-col justify-center items-start rounded-3xl flex-1 transition-all duration-200"
                      style={{
                        background: isSelected
                          ? gradient.selected
                          : gradient.unselected,
                        width: "111px",
                        height: "100px",
                        padding: "12px",
                        gap: "10px",
                        borderRadius: "24px",
                        opacity: isLoading ? 0.6 : 1,
                      }}
                    >
                      {/* Waffle icon container */}
                      <div
                        className="flex justify-center items-center rounded-full"
                        style={{
                          width: "40px",
                          height: "40px",
                          background: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "200px",
                        }}
                      >
                        <Image
                          src="/images/icons/waffle-small.png"
                          alt="waffle"
                          width={16}
                          height={12}
                          className="object-contain"
                        />
                      </div>
                      {/* Price */}
                      <span
                        className="font-body text-white"
                        style={{ fontSize: "28px", lineHeight: "100%" }}
                      >
                        ${price}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Balance Warning */}
              {!hasSufficientBalance && (
                <p className="text-amber-400 text-xs text-center px-4">
                  ⚠️ Insufficient USDC balance. Get tokens from the faucet.
                </p>
              )}

              {/* Buy Button */}
              <div className="w-full max-w-[361px]">
                <button
                  onClick={handlePurchase}
                  disabled={isButtonDisabled}
                  className="relative flex items-center justify-center px-6 bg-white text-[#191919] font-body font-normal uppercase tracking-[-0.02em] text-center leading-[115%] w-full rounded-[12px] border-[5px] border-t-0 border-l-0 border-[var(--brand-cyan)] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    height: "clamp(44px, 8vh, 54px)",
                    fontSize: "clamp(20px, 4vw, 26px)",
                  }}
                >
                  {!onchainId ? "GAME NOT AVAILABLE" : buttonText}
                </button>
              </div>

              {/* Status Message */}
              {step !== "idle" && step !== "error" && (
                <p className="text-white/50 text-xs text-center animate-pulse">
                  {step === "switching-chain" && "Switching to Base Sepolia..."}
                  {step === "pending" && "Please confirm in your wallet..."}
                  {step === "confirming" && "Waiting for confirmation..."}
                  {step === "syncing" && "Finalizing purchase..."}
                </p>
              )}

              {/* Error Message */}
              {isError && (
                <p className="text-red-400 text-sm text-center">
                  Transaction failed. Please try again.
                </p>
              )}

              {/* Potential Payout */}
              <div
                className="flex justify-between items-center w-full max-w-[361px] rounded-2xl"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(27, 245, 176, 0.12) 100%)",
                  padding: "clamp(8px, 2vh, 12px) clamp(12px, 3vw, 16px)",
                }}
              >
                <span
                  className="font-display text-white"
                  style={{
                    fontSize: "clamp(10px, 2vw, 12px)",
                    opacity: 0.5,
                  }}
                >
                  Potential payout
                </span>
                <span
                  className="font-body"
                  style={{
                    fontSize: "clamp(18px, 4vw, 22px)",
                    color: "#14B985",
                  }}
                >
                  ${potentialPayout}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
