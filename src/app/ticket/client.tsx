"use client";

import { useCallback, useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";

import { env } from "@/lib/env";
import { Share } from "./_components/Share";

import { purchaseTicketAction } from "@/actions/ticket";
import { useAuth } from "@/hooks/useAuth";

import { notify } from "@/components/ui/Toaster";

import { CardStack } from "@/components/CardStack";
import { motion } from "framer-motion";

import { TicketPageGameInfo, TicketPageUserInfo } from "./page";

type TicketPageClientImplProps = {
  gameInfoPromise: Promise<TicketPageGameInfo>;
  userInfoPromise: Promise<TicketPageUserInfo | null>;
};

export default function TicketPageClientImpl({
  gameInfoPromise,
  userInfoPromise,
}: TicketPageClientImplProps) {
  const router = useRouter();

  const gameInfo = use(gameInfoPromise);
  const userInfo = use(userInfoPromise);

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // OnchainKit Hooks
  // const { sendTokenAsync } = useSendToken();
  const { composeCastAsync } = useComposeCast();
  const { signIn } = useAuth();

  // --- Handlers ---
  const handlePurchase = async () => {
    if (!userInfo || !gameInfo) {
      setPurchaseError("User or game data is missing.");
      return;
    }

    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      // Authenticate user before purchase (REQUIRED for purchases)
      const token = await signIn();
      if (!token) {
        setPurchaseError("Authentication required to purchase tickets.");
        notify.error("Please sign in to purchase a ticket");
        return;
      }

      notify.info("Processing purchase (test mode, no transaction sent)...");

      let txHash: string | null = null;
      // SKIP sending token transaction for now, just call server action directly.
      // Simulate a txHash for test purposes.
      txHash =
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdfa";

      // Call Server Action to record/confirm purchase
      const formData = new FormData();
      formData.append("fid", String(userInfo?.fid));
      formData.append("gameId", String(gameInfo.id));
      formData.append("authToken", token); // Include auth token
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
      } else if (message.includes("Authentication required")) {
        displayError = message;
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
    if (!userInfo?._count.tickets || !gameInfo) return; // Use combined ticket state

    try {
      const message = `Just secured my waffle ticket for ${gameInfo.name}! 🧇`;
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
  }, [userInfo?._count.tickets, gameInfo, composeCastAsync]);

  // --- Derived State ---
  const prizePool = useMemo(() => {
    const ticketPrice = gameInfo?.config?.ticketPrice ?? 50;
    const additionPrizePool = gameInfo?.config?.additionPrizePool ?? 0;

    const calculatedPool =
      gameInfo._count.tickets * ticketPrice + additionPrizePool;
    return calculatedPool;
  }, [gameInfo]);
  const theme = useMemo(() => {
    return gameInfo?.config?.theme ? gameInfo.config.theme : "FOOTBALL";
  }, [gameInfo?.config?.theme]);

  const spotsAvatars = useMemo(() => {
    return [
      "/images/avatars/a.png",
      "/images/avatars/b.png",
      "/images/avatars/c.png",
      "/images/avatars/d.png",
    ];
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center gap-3 justify-center overflow-y-auto pt-1">
      {showShare ? (
        <Share
          gameTitle={gameInfo.name}
          theme={theme}
          username={userInfo?.name || "Player"}
          avatarUrl={userInfo?.imageUrl || "/images/avatars/a.png"}
          prizePool={prizePool}
          startTime={gameInfo.startTime}
          fid={userInfo?.fid ?? 0}
          onShare={shareTicket}
          gameId={gameInfo.id}
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
                    {gameInfo?._count?.tickets ?? 0}/
                    {gameInfo?.config?.maxPlayers ?? 0}
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
                    : userInfo?._count?.tickets && userInfo._count.tickets > 0
                    ? `TICKET SECURED!`
                    : `BUY WAFFLE ($${gameInfo?.config?.ticketPrice ?? "?"})`}
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
        </>
      )}
    </div>
  );
}
