"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector";
import { parseUnits } from "viem";
import { useTokenBalance } from "@/hooks/waffleContractHooks";
import { useFaucet } from "@/hooks/useFaucet";

import {
  useTicketPurchase,
  getPurchaseButtonText,
} from "@/hooks/useTicketPurchase";
import { PurchaseView, type PurchaseStep } from "./PurchaseView";
import { PAYMENT_TOKEN_DECIMALS } from "@/lib/chain";

interface BuyTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  onchainId: `0x${string}` | null;
  theme: string;
  themeIcon?: string;
  tierPrices: number[];
  username?: string;
  userAvatar?: string;
  onPurchaseSuccess?: () => void;
}

export function BuyTicketModal({
  isOpen,
  onClose,
  gameId,
  onchainId,
  theme,
  themeIcon,
  tierPrices,
  username = "Player",
  userAvatar,
  onPurchaseSuccess,
}: BuyTicketModalProps) {
  const router = useRouter();
  const { context } = useMiniKit();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [selectedTier, setSelectedTier] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Track if we've already tried faucet for this modal session
  const hasRequestedFaucet = useRef(false);

  // Derived display values
  const displayUsername =
    username !== "Player" ? username : context?.user?.username || "Player";
  const displayAvatar = userAvatar || context?.user?.pfpUrl;
  const selectedPrice = tierPrices[selectedTier] ?? 0;
  const potentialPayout = Math.round(selectedPrice * 21.1);

  // Token balance for auto-faucet in test mode
  const { data: balance, refetch: refetchBalance } = useTokenBalance(address as `0x${string}`);
  const { requestTokens, isLoading: isFaucetLoading, isTestMode } = useFaucet();

  // Auto-connect wallet when modal opens (Farcaster MiniApp pattern)
  useEffect(() => {
    if (isOpen && !isConnected) {
      connect({
        connector: farcasterFrame(),
      });
    }
  }, [isOpen, isConnected, connect]);

  // Reset faucet request flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasRequestedFaucet.current = false;
    }
  }, [isOpen]);

  // Auto-faucet in test mode when wallet has insufficient balance
  useEffect(() => {
    const priceInUnits = parseUnits(selectedPrice.toString(), PAYMENT_TOKEN_DECIMALS);
    const hasInsufficientBalance = balance !== undefined && (balance as bigint) < priceInUnits;

    if (
      isTestMode &&
      isConnected &&
      address &&
      hasInsufficientBalance &&
      !hasRequestedFaucet.current &&
      !isFaucetLoading
    ) {
      hasRequestedFaucet.current = true;
      console.log("[Faucet] Auto-requesting test tokens for", address);
      requestTokens(address).then((result) => {
        if (result.success) {
          // Refetch balance after successful airdrop
          setTimeout(() => refetchBalance(), 2000);
        }
      });
    }
  }, [isTestMode, isConnected, address, balance, selectedPrice, requestTokens, isFaucetLoading, refetchBalance]);

  // Use the ticket purchase hook
  const {
    step,
    isLoading,
    isSuccess,
    isError,
    hasTicket,
    purchase,
    reset,
  } = useTicketPurchase(gameId, onchainId, selectedPrice, onPurchaseSuccess);

  // Redirect to success page ONLY on fresh purchase success
  useEffect(() => {
    if (isSuccess) {
      // Fresh purchase completed → redirect to success page
      const successParams = new URLSearchParams();
      successParams.set("username", displayUsername);
      if (displayAvatar) {
        successParams.set("pfpUrl", displayAvatar);
      }
      router.push(`/game/${gameId}/ticket/success?${successParams.toString()}`);
    }
  }, [isSuccess, gameId, displayUsername, displayAvatar, router]);

  // If user already has a ticket (detected by hook), close modal
  useEffect(() => {
    if (hasTicket && !isSuccess) {
      onClose();
    }
  }, [hasTicket, isSuccess, onClose]);


  // Handle modal entrance animation
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsAnimating(false);
      reset();
    }
  }, [isOpen, reset]);

  // Computed states
  const isPurchased = hasTicket || isSuccess;
  const isWalletReady = isConnected && !!address;
  const buttonText = !isWalletReady ? "Connecting wallet..." : getPurchaseButtonText(step, selectedPrice);
  // Note: Don't check balance here - Farcaster wallet handles insufficient balance automatically
  const isButtonDisabled = isLoading || !onchainId || isPurchased || !isWalletReady;

  // Handle purchase button click
  const handlePurchase = () => {
    if (isError) {
      reset();
    } else {
      purchase();
    }
  };

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Backdrop with fade animation */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          opacity: isAnimating ? 1 : 0,
          transition: "opacity 0.3s ease",
          backdropFilter: isAnimating ? "blur(4px)" : "blur(0px)",
        }}
        onClick={handleClose}
      />

      {/* Modal with slide-up animation */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[20px] overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #1E1E1E 0%, #000000 100%)",
          maxHeight: "85dvh",
          transform: isAnimating ? "translateY(0)" : "translateY(100%)",
          opacity: isAnimating ? 1 : 0,
          transition: "all 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
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
            style={{
              background: "rgba(255, 255, 255, 0.4)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.6)";
              e.currentTarget.style.transform = "scaleX(1.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.4)";
              e.currentTarget.style.transform = "scaleX(1)";
            }}
            onClick={handleClose}
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
          <PurchaseView
            theme={theme}
            themeIcon={themeIcon}
            tierPrices={tierPrices}
            selectedTier={selectedTier}
            onSelectTier={setSelectedTier}
            potentialPayout={potentialPayout}
            isLoading={isLoading}
            isError={isError}
            step={step as PurchaseStep}
            buttonText={buttonText}
            isButtonDisabled={isButtonDisabled}
            onchainId={onchainId}
            onPurchase={handlePurchase}
          />
        </div>
      </div>
    </>
  );
}
