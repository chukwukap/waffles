"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useComposeCast, useSendToken } from "@coinbase/onchainkit/minikit";
import LogoIcon from "@/components/logo/LogoIcon";
import { cn } from "@/lib/utils";
import { WalletIcon } from "@/components/icons";
import { BottomNav } from "@/components/BottomNav";
import Image from "next/image";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";

import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { env } from "@/lib/env";
import { Share } from "./_components/Share";
import { base } from "wagmi/chains";

import { purchaseTicketAction } from "@/actions/ticket";

import { notify } from "@/components/ui/Toaster";

import { HydratedGame, HydratedUser } from "@/state/types";
import { CardStack } from "@/components/CardStack";
import { motion } from "framer-motion";

import { useAccount } from "wagmi";

type LobbyPageClientImplProps = {
  games: HydratedGame[];
  userInfo: HydratedUser | null;
};

export default function LobbyPageClientImpl({
  games,
  userInfo,
}: LobbyPageClientImplProps) {
  const router = useRouter();
  const account = useAccount();
  const [activeGame] = useState(games[0]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // OnchainKit Hooks
  const { sendTokenAsync } = useSendToken();
  const { composeCastAsync } = useComposeCast();
  const { roundedBalance } = useGetTokenBalance(
    account.address as `0x${string}`,
    {
      address: env.nextPublicUsdcAddress as `0x${string}`,
      chainId: base.id,
      decimals: 6,
      image: "/images/tokens/usdc.png",
      name: "USDC",
      symbol: "USDC",
      // Removed unnecessary token details if configured globally or relying on defaults
    }
  );

  // --- Handlers ---
  const handlePurchase = async () => {
    if (!userInfo || !activeGame.config) {
      setPurchaseError("User or game data is missing.");
      return;
    }
    // if (!hasValidInvite) {
    //   setPurchaseError("Redeem an invite code before buying a ticket.");
    //   return;
    // }

    setIsPurchasing(true);
    setPurchaseError(null);
    notify.info("Processing purchase...");

    let txHash: string | null = null;
    try {
      // 1. Send Token via OnchainKit
      const price = activeGame?.config?.ticketPrice;

      // actually just send 0.01 usdc for testing
      const amount = (0.01 * 10 ** 6).toString();
      // const amount = (price * 10 ** 6).toString(); // 6 decimals for USDC (1 USDC = 10^6)
      const recipient = env.waffleMainAddress;

      console.log(`Sending ${amount} (${price} USDC) to ${recipient}`);

      const sendResult = await sendTokenAsync({
        amount,
        recipientAddress: recipient,
        token: env.nextPublicUsdcAddress as `0x${string}`,
      });

      if (!sendResult.success) {
        throw new Error("Failed to send token");
      }
      txHash =
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdfa";
      notify.info("Transaction sent, confirming ticket...");

      // 2. Call Server Action to record/confirm purchase
      const formData = new FormData();
      formData.append("fid", String(userInfo?.fid));
      formData.append("gameId", String(activeGame.id));
      if (txHash) {
        formData.append("txHash", txHash);
      }

      const result = await purchaseTicketAction(null, formData);
      console.log("resultttttttttttt: ", result);

      if (result.success) {
        notify.success(
          result.alreadyExists
            ? "Ticket purchase confirmed!"
            : "Ticket secured!"
        );

        // Manually trigger revalidation for SWR caches
        router.refresh();
        setShowShare(true); // Show the share screen
      } else {
        throw new Error(result.error); // Throw error to be caught below
      }
    } catch (err) {
      console.error("Ticket purchase failed:", err);
      const message =
        err instanceof Error ? err.message : "An unknown error occurred.";

      // Refine error messages
      let displayError = "Ticket purchase failed. Please try again.";
      if (message.toLowerCase().includes("user rejected")) {
        displayError = "Transaction cancelled.";
      } else if (message.includes("Invite required")) {
        displayError = "Redeem an invite code before buying a ticket.";
        // Consider redirecting here too if desired
      } else if (message.includes("insufficient funds")) {
        displayError = "Insufficient funds for transaction.";
      } else if (
        message.includes("already purchased") ||
        message.includes("already exists")
      ) {
        displayError = "You already have a ticket for this game.";
        // Manually trigger revalidation just in case state is stale
        router.refresh();
      } else if (message) {
        displayError = message; // Show specific error from action/transaction
      }

      setPurchaseError(displayError);
      notify.error(displayError);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleBackToHome = useCallback(
    () => router.replace(`/lobby`),
    [router]
  );

  const shareTicket = useCallback(async () => {
    //
    if (!userInfo?.tickets[0] || !activeGame) return; // Use combined ticket state

    try {
      const message = `Just secured my waffle ticket for ${activeGame.name}! 🧇`; // Added emoji!
      // notify.info("Opening Farcaster cast composer...");
      const result = await composeCastAsync({
        text: message,
        embeds: [env.rootUrl ? { url: env.rootUrl } : undefined].filter(
          Boolean
        ) as [], // Correct embed format
      });

      if (result?.cast) {
        //
        notify.success("Shared successfully!");
        console.log("Cast created successfully:", result.cast.hash);
      } else {
        notify.info("Cast cancelled.");
        console.log("User cancelled the cast");
      }
    } catch (error) {
      console.error("Error sharing cast:", error);
      notify.error("Unable to share your ticket right now.");
    }
  }, [userInfo?.tickets, activeGame, composeCastAsync]);

  // --- Derived State ---
  const prizePool = useMemo(() => {
    // Use defaults from schema if config or fields are missing
    const ticketPrice = activeGame?.config?.ticketPrice ?? 50;
    const additionPrizePool = activeGame?.config?.additionPrizePool ?? 0;

    const calculatedPool =
      activeGame._count.tickets * ticketPrice + additionPrizePool;
    return calculatedPool;
  }, [activeGame]);
  const theme = useMemo(() => {
    return activeGame?.config?.theme
      ? activeGame.config.theme.toLowerCase()
      : "theme-default";
  }, [activeGame?.config?.theme]);

  const spotsAvatars = useMemo(() => {
    // const friendAvatars = friends
    //   .filter((friend) => friend.hasTicket && friend.pfpUrl)
    //   .map((friend) => friend.pfpUrl!)
    //   .slice(0, 4);
    // if (friendAvatars.length >= 4) return friendAvatars; // Prioritize friends fully if possible

    // if (friendAvatars.length >= 4) return friendAvatars.slice(0, 4);

    // Absolute fallback
    return [
      "/images/avatars/a.png",
      "/images/avatars/b.png",
      "/images/avatars/c.png",
      "/images/avatars/d.png",
    ];
  }, []);

  if (!userInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80dvh] text-center px-4">
        User not found
      </div>
    );
  }

  if (!activeGame) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80dvh] text-center px-4">
        Game not found
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1E1E1E] to-black text-white">
      {/* ─────────────── Header ─────────────── */}
      <header
        className={cn(
          "p-4 flex items-center justify-between border-b border-border bg-figma"
        )}
      >
        <LogoIcon />
        <div className="flex items-center gap-1.5 bg-figma rounded-full px-3 py-1.5">
          <WalletIcon className="w-4 h-4 text-foreground" />
          <span className="text-xs text-foreground">{`$${
            roundedBalance ? roundedBalance : "---"
          }`}</span>
        </div>
      </header>
      {/* ─────────────── Main Content ─────────────── */}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col items-center gap-3 justify-center overflow-y-auto pt-4 pb-20 mt-6">
        {showShare ? (
          <Share
            gameTitle={activeGame.name}
            theme={theme}
            username={userInfo?.name || "Player"}
            avatarUrl={userInfo?.imageUrl || "/images/avatars/a.png"}
            prizePool={prizePool}
            startTime={activeGame.startTime}
            onShare={shareTicket}
            onBackHome={handleBackToHome}
          />
        ) : (
          <>
            <main className="flex flex-col items-center justify-center flex-1 w-full px-4 py-10 sm:py-14 text-center">
              <div className="flex flex-row items-center justify-between w-[350px] h-[50px] mx-auto">
                <div className="flex flex-col justify-center items-start h-full">
                  <p className="font-brockmann text-[#99A0AE] text-sm leading-[130%] tracking-[-0.03em]">
                    Next game theme
                  </p>
                  <h1 className="font-edit-undo text-white text-[32px] leading-none">
                    {theme.toUpperCase()}
                  </h1>
                </div>
                <Image
                  src={`/images/illustrations/theme-${theme}.svg`}
                  alt={theme.toUpperCase()}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>

              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <Image
                  src="/images/illustrations/waffles.svg"
                  alt="Waffle"
                  width={230}
                  height={130}
                  priority
                  className="mx-auto mb-8"
                />
              </motion.div>

              <h2 className="font-edit-undo text-3xl sm:text-[2.5rem] mb-4">
                GET YOUR WAFFLE
              </h2>

              <div className="w-full max-w-md border border-white/10 rounded-2xl flex flex-wrap justify-center gap-8 px-4 py-6 mb-8">
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src="/images/illustrations/seats.svg"
                    alt="Spots"
                    width={48}
                    height={40}
                  />
                  <div className="text-[#99A0AE] font-display text-base">
                    Spots
                  </div>
                  <div className="font-edit-undo text-3xl">
                    {activeGame?._count?.tickets ?? 0}/
                    {activeGame?.config?.maxPlayers ?? 0}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src="/images/illustrations/money-stack.svg"
                    alt="Prize"
                    width={48}
                    height={40}
                  />
                  <div className="text-[#99A0AE] font-display text-base">
                    Prize pool
                  </div>
                  <div className="font-edit-undo text-3xl">${prizePool}</div>
                </div>
                <div className="w-full max-w-[400px] px-4">
                  <FancyBorderButton
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                  >
                    {isPurchasing
                      ? "PROCESSING..."
                      : userInfo?.tickets[0]?.status !== "confirmed"
                      ? `BUY WAFFLE ($${
                          activeGame?.config?.ticketPrice ?? "?"
                        })`
                      : `GAME LOBBY`}
                  </FancyBorderButton>
                  {purchaseError && (
                    <p className="mt-3 text-center text-sm text-red-400">
                      {purchaseError}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center mt-8">
                <CardStack
                  images={spotsAvatars.map((ava) => ({ src: ava }))}
                  size="clamp(32px,7vw,48px)"
                  borderColor="#fff"
                />
                <p className="font-brockmann text-[#99A0AE] text-sm mt-2">
                  and 2 others have joined the game
                </p>
              </div>
            </main>
            <BottomNav />
          </>
        )}
      </div>
    </div>
  );
}
