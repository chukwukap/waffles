"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
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
  console.log("games in lobbyClient", games);
  const router = useRouter();
  const account = useAccount();
  const [activeGame] = useState(games[0]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // OnchainKit Hooks
  // const { sendTokenAsync } = useSendToken();
  const { composeCastAsync } = useComposeCast();
  const { roundedBalance, status } = useGetTokenBalance(
    account.address as `0x${string}`,
    {
      address: env.nextPublicUsdcAddress as `0x${string}`,
      chainId: base.id,
      decimals: 6,
      image: "/images/tokens/usdc.png",
      name: "USDC",
      symbol: "USDC",
    }
  );

  // --- Handlers ---
  const handlePurchase = async () => {
    if (!userInfo || !activeGame.config) {
      setPurchaseError("User or game data is missing.");
      return;
    }

    setIsPurchasing(true);
    setPurchaseError(null);
    notify.info("Processing purchase (test mode, no transaction sent)...");

    let txHash: string | null = null;
    try {
      // SKIP sending token transaction for now, just call server action directly.
      // Simulate a txHash for test purposes.
      txHash =
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdfa";

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

        router.refresh();
        setShowShare(true); // Show the share screen
      } else {
        throw new Error(result.error);
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
      } else if (message.includes("insufficient funds")) {
        displayError = "Insufficient funds for transaction.";
      } else if (
        message.includes("already purchased") ||
        message.includes("already exists")
      ) {
        displayError = "You already have a ticket for this game.";
        router.refresh();
      } else if (message) {
        displayError = message;
      }

      setPurchaseError(displayError);
      notify.error(displayError);
    } finally {
      setIsPurchasing(false);
    }
  };

  const shareTicket = useCallback(async () => {
    //
    if (!userInfo?.tickets[0] || !activeGame) return; // Use combined ticket state

    try {
      const message = `Just secured my waffle ticket for ${activeGame.name}! 🧇`;
      const result = await composeCastAsync({
        text: message,
        embeds: [env.rootUrl ? { url: env.rootUrl } : undefined].filter(
          Boolean
        ) as [],
      });

      if (result?.cast) {
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
    const ticketPrice = activeGame?.config?.ticketPrice ?? 50;
    const additionPrizePool = activeGame?.config?.additionPrizePool ?? 0;

    const calculatedPool =
      activeGame._count.tickets * ticketPrice + additionPrizePool;
    return calculatedPool;
  }, [activeGame]);
  const theme = useMemo(() => {
    return activeGame?.config?.theme ? activeGame.config.theme : "FOOTBALL";
  }, [activeGame?.config?.theme]);

  const spotsAvatars = useMemo(() => {
    return [
      "/images/avatars/a.png",
      "/images/avatars/b.png",
      "/images/avatars/c.png",
      "/images/avatars/d.png",
    ];
  }, []);

  // if (!userInfo) {
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-[80dvh] text-center px-4">
  //       User not found
  //     </div>
  //   );
  // }

  // if (!activeGame) {
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-[80dvh] text-center px-4">
  //       Game not found
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen flex flex-col text-white ">
      {/* ─────────────── Header ─────────────── */}
      <header
        className={cn(
          "p-1 px-3 flex items-center justify-between border-b border-border bg-[#191919]"
        )}
      >
        <LogoIcon />
        <div
          className="flex flex-row justify-center items-center px-3 py-1.5 gap-1 rounded-full"
          style={{
            width: 96,
            height: 28,
            background: "rgba(249,249,249,0.1)",
            borderRadius: 900,
          }}
        >
          <span
            className="flex items-center justify-center"
            style={{
              width: 16,
              height: 16,
              flex: "none",
              order: 0,
              flexGrow: 0,
              position: "relative",
            }}
          >
            <WalletIcon className="w-4 h-4 text-white" />
          </span>
          <span
            className="font-edit-undo text-white"
            style={{
              fontStyle: "normal",
              fontWeight: 400,
              fontSize: 16,
              lineHeight: "14px",
              width: 52,
              height: 14,
              textAlign: "center" as const,
              flex: "none",
              order: 1,
              flexGrow: 0,
              display: "inline-block",
            }}
          >
            {status === "pending" ? "---" : `$${roundedBalance}`}{" "}
          </span>
        </div>
      </header>
      {/* ─────────────── Main Content ─────────────── */}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col items-center gap-3 justify-center overflow-y-auto pt-5">
        {showShare ? (
          <Share
            gameTitle={activeGame.name}
            theme={theme}
            username={userInfo?.name || "Player"}
            avatarUrl={userInfo?.imageUrl || "/images/avatars/a.png"}
            prizePool={prizePool}
            startTime={activeGame.startTime}
            onShare={shareTicket}
            gameId={activeGame.id}
          />
        ) : (
          <>
            <main className="flex flex-col items-center justify-center flex-1 w-full px-4 pb-20  text-center">
              <div className="flex flex-row items-center justify-between w-[350px] h-[50px] mx-auto">
                <div className="flex flex-col justify-center items-start h-full">
                  <p className="font-body text-[#99A0AE] text-sm leading-[130%] tracking-[-0.03em]">
                    Next game theme
                  </p>
                  <h1 className="font-edit-undo text-white text-[32px] leading-none">
                    {theme.toUpperCase()}
                  </h1>
                </div>
                <Image
                  src={`/images/themes/${theme}.svg`}
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
                  height={100}
                  priority
                  className="mx-auto mb-2"
                />
              </motion.div>

              <h2 className="font-edit-undo text-3xl sm:text-[2.5rem] mb-4">
                GET YOUR WAFFLE
              </h2>

              <div className="w-full max-w-md border border-white/10 rounded-2xl flex flex-wrap justify-center gap-2 px-4 py-6 mb-3">
                <div className="flex-[1_1_0] basis-0 min-w-0 flex flex-col items-center gap-2 justify-start max-w-[170px] w-full">
                  <div className="flex flex-col items-center w-full h-full justify-between">
                    <Image
                      src="/images/illustrations/seats.svg"
                      alt="Spots"
                      width={48}
                      height={40}
                    />
                    <div className="text-[#99A0AE] font-display text-base text-center mt-2">
                      Spots
                    </div>
                    <div className="font-edit-undo text-3xl text-center mt-1">
                      {activeGame?._count?.tickets ?? 0}/
                      {activeGame?.config?.maxPlayers ?? 0}
                    </div>
                  </div>
                </div>
                <div className="flex-[1_1_0] basis-0 min-w-0 flex flex-col items-center gap-2 justify-start max-w-[170px] w-full">
                  <div className="flex flex-col items-center w-full h-full justify-between">
                    <Image
                      src="/images/illustrations/money-stack.svg"
                      alt="Prize"
                      width={48}
                      height={40}
                    />
                    <div className="text-[#99A0AE] font-display text-base text-center mt-2">
                      Prize pool
                    </div>
                    <div className="font-edit-undo text-3xl text-center mt-1">
                      ${prizePool}
                    </div>
                  </div>
                </div>
                <div className="w-full max-w-[400px] px-4">
                  <FancyBorderButton
                    onClick={handlePurchase}
                    disabled={
                      isPurchasing
                      // userInfo?.tickets[0]?.status === "confirmed"
                    }
                  >
                    {isPurchasing
                      ? "PROCESSING..."
                      : userInfo?.tickets[0]?.status !== "confirmed"
                      ? `BUY WAFFLE ($${
                          activeGame?.config?.ticketPrice ?? "?"
                        })`
                      : `TICKET SECURED!`}
                  </FancyBorderButton>
                  {purchaseError && (
                    <p className="mt-3 text-center text-sm text-red-400">
                      {purchaseError}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center mt-2">
                <CardStack
                  images={spotsAvatars.map((ava) => ({ src: ava }))}
                  size="clamp(32px,7vw,48px)"
                  borderColor="#fff"
                />
                <p className="font-display text-[#99A0AE] text-sm mt-2">
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
