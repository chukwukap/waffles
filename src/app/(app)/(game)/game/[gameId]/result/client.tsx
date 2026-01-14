"use client";

import { use, useState, useEffect, useMemo, useRef, useCallback } from "react";
import GameResultCard from "../_component/GameResultCard";
import Top3Leaderboard from "./_components/Top3Leaderboard";
import Image from "next/image";
import { WaffleButton } from "@/components/buttons/WaffleButton";
import { FlashIcon } from "@/components/icons";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";
import { playSound } from "@/lib/sounds";
import { notify } from "@/components/ui/Toaster";
import { env } from "@/lib/env";
import sdk from "@farcaster/miniapp-sdk";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSendCalls, useCallsStatus, useAccount } from "wagmi";
import { useMiniKit, useComposeCast } from "@coinbase/onchainkit/minikit";
import { Abi, encodeFunctionData } from "viem";
import { WAFFLE_GAME_CONFIG } from "@/lib/chain";
import waffleGameAbi from "@/lib/chain/abi.json";
import { Spinner } from "@/components/ui/spinner";
import confetti from "canvas-confetti";
import { Game } from "@prisma";
import { WINNERS_COUNT } from "@/lib/game/prizeDistribution";
import { CLAIM_DELAY_MS } from "@/lib/constants";

// ==========================================
// TYPES
// ==========================================

type ClaimState =
  | "idle"
  | "fetching"
  | "confirming"
  | "success"
  | "error"
  | "pending";

// Entry data type for this specific game (independent of global context)
interface ResultEntryData {
  id: string;
  score: number;
  answered: number;
  paidAt: string | null;
  rank: number | null;
  prize: number | null;
  claimedAt: string | null;
  answeredQuestionIds: string[];
}

// ==========================================
// COMPONENT
// ==========================================

type Top3Entry = {
  score: number;
  rank: number | null;
  user: {
    fid: number;
    username: string | null;
    pfpUrl: string | null;
  } | null;
};

export default function ResultPageClient({
  gamePromise,
  top3Promise,
}: {
  gamePromise: Promise<Game | null>;
  top3Promise: Promise<Top3Entry[]>;
}) {
  const game = use(gamePromise);
  const top3Entries = use(top3Promise);
  const { address } = useAccount();
  const { context } = useMiniKit();
  const { composeCastAsync } = useComposeCast();
  const gameId = game?.id;
  const gameNumber = game?.gameNumber ?? 0;

  // Local entry state - fetched independently for THIS specific game
  // This ensures result page works regardless of what game is in global context
  const [entry, setEntry] = useState<ResultEntryData | null>(null);
  const [entryLoading, setEntryLoading] = useState(true);

  const hasPlayedSound = useRef(false);

  // Fetch entry data for this specific game (independent of global context)
  const fetchEntry = useCallback(async () => {
    const fid = context?.user?.fid;
    if (!gameId || !fid) {
      setEntryLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/v1/games/${gameId}/entry?fid=${fid}`);
      if (res.ok) {
        const data = await res.json();
        setEntry(data);
      } else {
        // User might not have an entry for this game
        setEntry(null);
      }
    } catch (e) {
      console.error("[ResultPage] Failed to fetch entry:", e);
      setEntry(null);
    } finally {
      setEntryLoading(false);
    }
  }, [gameId, context?.user?.fid]);

  // Initial fetch on mount
  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  // Alias for refetchEntry (used in claim flow)
  const refetchEntry = fetchEntry;

  // Claim state
  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [claimError, setClaimError] = useState<string | null>(null);
  console.log("claimError", claimError);
  const [claimCountdown, setClaimCountdown] = useState<string | null>(null);

  // Check if already claimed from entry
  const hasClaimed =
    entry?.claimedAt !== null && entry?.claimedAt !== undefined;

  // Calculate when claim window opens (1 hour after game ends)
  const claimOpensAt = useMemo(() => {
    if (!game?.endsAt) return null;
    return new Date(new Date(game.endsAt).getTime() + CLAIM_DELAY_MS);
  }, [game?.endsAt]);

  // Check if claim window is open
  const isClaimWindowOpen = useMemo(() => {
    if (!claimOpensAt) return false;
    return new Date() >= claimOpensAt;
  }, [claimOpensAt]);

  // Countdown timer for claim window
  useEffect(() => {
    if (!claimOpensAt || isClaimWindowOpen || hasClaimed) {
      setClaimCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = claimOpensAt.getTime() - now.getTime();

      if (diff <= 0) {
        setClaimCountdown(null);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setClaimCountdown(`${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [claimOpensAt, isClaimWindowOpen, hasClaimed]);

  // Get onchainId
  const onchainId = game?.onchainId;

  // User score from GameProvider entry
  const userScore = useMemo(() => {
    if (!entry) return null;

    const total = game?.playerCount ?? 0;
    const rank = entry.rank ?? 0;
    const percentile =
      total > 1 ? Math.round(((total - rank) / (total - 1)) * 100) : 100;

    return {
      score: entry.score,
      rank,
      winnings: entry.prize ?? 0,
      percentile: Math.max(0, Math.min(100, percentile)),
    };
  }, [entry, game?.playerCount]);

  // Is user a winner (rank 1-10)?
  const isWinner = useMemo(() => {
    return (
      userScore !== null &&
      userScore.rank <= WINNERS_COUNT &&
      userScore.winnings > 0
    );
  }, [userScore]);

  // Play sound and confetti on mount (once)
  useEffect(() => {
    if (!hasPlayedSound.current && userScore) {
      hasPlayedSound.current = true;
      playSound(userScore.rank <= WINNERS_COUNT ? "victory" : "defeat");

      // Fire confetti for winners (rank 1-10)
      if (userScore.rank <= WINNERS_COUNT && userScore.winnings > 0) {
        // Initial burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#FFC931", "#14B985", "#FB72FF"],
        });

        // Side bursts
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: ["#FFC931", "#14B985"],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: ["#FB72FF", "#00CFF2"],
          });
        }, 250);
      }
    }
  }, [userScore]);

  // If already claimed, set state
  useEffect(() => {
    if (hasClaimed) {
      setClaimState("success");
    }
  }, [hasClaimed]);

  // ==========================================
  // SHARE SCORE
  // ==========================================

  const handleShareScore = useCallback(async () => {
    if (!context?.user || !userScore) return;

    try {
      const prizeText =
        userScore.winnings > 0
          ? `Just won $${userScore.winnings.toLocaleString()} on Waffles! 🧇🏆`
          : `Just scored ${userScore.score} points on Waffles! 🧇`;

      // Build frame URL with params - this page has fc:frame metadata
      const frameParams = new URLSearchParams();
      frameParams.set("username", context?.user?.username ?? "Anon");
      frameParams.set("prizeAmount", userScore.winnings.toString());
      frameParams.set("score", userScore.score.toString());
      if (context?.user?.pfpUrl) {
        frameParams.set("pfpUrl", context.user.pfpUrl);
      }
      const frameUrl = `${env.rootUrl
        }/game/${gameId}/result?${frameParams.toString()}`;

      const result = await composeCastAsync({
        text: prizeText,
        embeds: [frameUrl],
      });

      if (result?.cast) {
        console.log("[Share] Cast created:", result.cast.hash);
        playSound("purchase");
        notify.success("Shared to Farcaster! 🎉");
        sdk.haptics.impactOccurred("light").catch(() => { });
      } else {
        console.log("[Share] User cancelled");
      }
    } catch (error) {
      console.error("[Share] Error:", error);
      notify.error("Failed to share");
    }
  }, [composeCastAsync, context?.user, userScore, gameId]);

  // ==========================================
  // CLAIM LOGIC
  // ==========================================

  const {
    sendCalls,
    data: callsId,
    isPending: isSending,
    error: sendError,
    reset: resetSendCalls,
  } = useSendCalls();

  const { data: callsStatus } = useCallsStatus({
    id: callsId?.id ?? "",
    query: {
      enabled: !!callsId?.id,
      refetchInterval: (data) => {
        if (data.state.data?.status === "success") return false;
        if (data.state.data?.status === "failure") return false;
        return 1000;
      },
    },
  });

  // Handle send errors
  useEffect(() => {
    if (sendError) {
      console.error("[Claim] Send error:", sendError);
      const errorMessage = sendError.message.includes("rejected")
        ? "Transaction rejected"
        : "Claim failed";
      setClaimError(errorMessage);
      setClaimState("error");
      notify.error(errorMessage);
    }
  }, [sendError]);

  // Sync claim with backend (defined before the effect that uses it)
  const syncClaimWithBackend = useCallback(async () => {
    try {
      const response = await sdk.quickAuth.fetch(
        `/api/v1/games/${gameId}/claim`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        console.warn("[Claim] Backend sync failed but on-chain succeeded");
      }
    } catch (error) {
      console.error("[Claim] Backend sync error:", error);
    } finally {
      // Always mark as success since on-chain TX succeeded
      setClaimState("success");
      refetchEntry(); // Refetch to get updated claimedAt
      playSound("purchase");
      notify.success("Prize claimed! 🎉");
      sdk.haptics.impactOccurred("medium").catch(() => { });
    }
  }, [gameId, refetchEntry]);

  // Handle calls status
  useEffect(() => {
    if (!callsStatus) return;

    console.log("[Claim] Calls status:", callsStatus.status);

    if (callsStatus.status === "failure") {
      setClaimError("Transaction failed on-chain");
      setClaimState("error");
      notify.error("Claim failed on-chain. Please try again.");
    }

    if (callsStatus.status === "success") {
      console.log("[Claim] TX confirmed!");
      // Sync with backend silently
      syncClaimWithBackend();
    }
  }, [callsStatus, syncClaimWithBackend]);

  // Handle claim button click
  const handleClaim = useCallback(async () => {
    // Already claimed - do nothing
    if (hasClaimed) {
      notify.info("Already claimed!");
      return;
    }

    // Check if claim window is open
    if (!isClaimWindowOpen) {
      notify.info("Claim window opens in " + claimCountdown);
      return;
    }

    if (!onchainId || !address) {
      notify.error("Cannot claim right now");
      return;
    }

    setClaimState("fetching");
    setClaimError(null);

    try {
      // 1. Fetch merkle proof
      console.log("[Claim] Fetching merkle proof...");
      const fid = context?.user?.fid;
      const proofRes = await fetch(
        `/api/v1/games/${gameId}/merkle-proof?fid=${fid}`
      );

      if (!proofRes.ok) {
        const errorData = await proofRes.json();
        // Check if game not settled yet
        if (
          errorData.code === "GAME_NOT_ENDED" ||
          errorData.code === "NO_WINNERS"
        ) {
          setClaimState("pending");
          return;
        }
        throw new Error(errorData.error || "Failed to get proof");
      }

      const { amount, proof, claimedAt } = await proofRes.json();
      console.log(
        "[Claim] Got proof, amount:",
        amount,
        "claimedAt:",
        claimedAt
      );

      // Check if already claimed from response
      if (claimedAt) {
        setClaimState("success");
        refetchEntry();
        notify.info("Prize already claimed!");
        return;
      }

      // 2. Send on-chain claim
      setClaimState("confirming");
      resetSendCalls();

      sendCalls({
        calls: [
          {
            to: WAFFLE_GAME_CONFIG.address,
            data: encodeFunctionData({
              abi: waffleGameAbi as Abi,
              functionName: "claimPrize",
              args: [onchainId, BigInt(amount), proof],
            }),
          },
        ],
      });
    } catch (error: unknown) {
      console.error("[Claim] Error:", error);
      setClaimError(error instanceof Error ? error.message : "Claim failed");
      setClaimState("error");
      notify.error(
        error instanceof Error ? error.message : "Failed to claim prize"
      );
    }
  }, [
    onchainId,
    address,
    gameId,
    sendCalls,
    resetSendCalls,
    hasClaimed,
    refetchEntry,
    isClaimWindowOpen,
    claimCountdown,
  ]);

  // Get button text based on state
  const getClaimButtonText = () => {
    if (entryLoading) return "Loading...";
    if (hasClaimed || claimState === "success") return "CLAIMED ✓";
    if (!isClaimWindowOpen && claimCountdown)
      return `OPENS IN ${claimCountdown}`;
    if (claimState === "pending") return "RESULTS PENDING";
    if (claimState === "fetching") return "Loading...";
    if (claimState === "confirming" || isSending) return "Claiming...";
    if (claimState === "error") return "RETRY";
    return "CLAIM PRIZE";
  };

  const isClaimDisabled =
    entryLoading ||
    hasClaimed ||
    !isClaimWindowOpen ||
    claimState === "success" ||
    claimState === "pending" ||
    claimState === "fetching" ||
    claimState === "confirming" ||
    isSending;

  // ==========================================
  // RENDER
  // ==========================================

  if (entryLoading) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <WaffleLoader text="LOADING SCORE..." />
        </div>
        <BottomNav />
      </>
    );
  }

  if (!context?.user || !userScore) {
    return (
      <>
        <div className="flex flex-col text-white items-center justify-center min-h-full">
          <p className="text-lg">Score not found.</p>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <div className="w-full px-4 text-white flex flex-col items-center flex-1 overflow-y-auto">
        <div className="flex flex-col justify-center items-center gap-2 w-[315px] mb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.1,
            }}
          >
            <Image
              src="/images/illustrations/waffles.svg"
              alt="waffle"
              width={228}
              height={132}
            />
          </motion.div>

          <motion.h1
            className="font-body text-[44px] leading-[92%] text-center tracking-[-0.03em] text-white w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            WAFFLES #{String(gameNumber).padStart(3, "0")}
          </motion.h1>

          <motion.div
            className="flex flex-row justify-center items-center gap-2.5 w-full mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <p className="font-display font-medium text-[16px] leading-[130%] text-center tracking-[-0.03em] text-[#99A0AE] capitalize">
              {game?.theme?.toLowerCase() ?? "trivia"}
            </p>
          </motion.div>
        </div>

        <GameResultCard
          winnings={userScore.winnings}
          score={userScore.score}
          rank={userScore.rank}
          pfpUrl={context.user.pfpUrl ?? ""}
          username={context.user.username ?? "Player"}
        />
        <div className="flex flex-col justify-center items-center gap-3 w-[361px] mt-5">
          {/* Percentile row */}
          <motion.div
            className="flex flex-row items-center gap-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut",
              }}
            >
              <FlashIcon className="w-4 h-4 text-[#FFC931]" />
            </motion.div>
            <span className="font-display font-medium text-[12px] leading-[14px] tracking-[-0.03em] text-white">
              You finished faster than {userScore.percentile}% of other players
            </span>
          </motion.div>

          {/* Buttons container */}
          <div className="flex flex-col items-start gap-5 w-full">
            {/* Claim Prize Button - Only show for winners */}
            {isWinner && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                whileHover={!isClaimDisabled ? { scale: 1.02 } : undefined}
                whileTap={!isClaimDisabled ? { scale: 0.98 } : undefined}
              >
                <WaffleButton
                  onClick={handleClaim}
                  disabled={isClaimDisabled}
                  className={
                    claimState === "success" || hasClaimed
                      ? "text-[#14B985] border-[#14B985] opacity-80"
                      : !isClaimWindowOpen
                        ? "text-amber-400 border-amber-400 opacity-80"
                        : claimState === "pending"
                          ? "text-amber-400 border-amber-400 opacity-80"
                          : claimState === "error"
                            ? "text-red-400 border-red-400"
                            : "text-[#14B985] border-[#14B985]"
                  }
                >
                  {(claimState === "confirming" || isSending) && (
                    <Spinner className="w-4 h-4 mr-2" />
                  )}
                  {getClaimButtonText()}
                </WaffleButton>
                {claimState === "pending" && (
                  <p className="text-amber-400 text-xs text-center mt-2">
                    Admin is finalizing results. Check back soon!
                  </p>
                )}
              </motion.div>
            )}

            {/* Share Score & Back to Home row */}
            <motion.div
              className="flex flex-row items-start gap-3 w-full"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              {/* Share Score Button */}
              <motion.button
                className="flex flex-row justify-center items-center p-3 gap-2 flex-1 bg-white/9 border-2 border-white/40 rounded-[12px]"
                onClick={handleShareScore}
                whileHover={{
                  scale: 1.03,
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  borderColor: "rgba(255, 255, 255, 0.6)",
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <span className="font-body font-normal text-[18px] leading-[115%] tracking-[-0.02em] text-white">
                  SHARE SCORE
                </span>
              </motion.button>

              {/* Back to Home Button */}
              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href="/game"
                  className="flex flex-row justify-center items-center p-3 gap-2 w-full bg-white/9 border-2 border-white/40 rounded-[12px] no-underline hover:bg-white/15 hover:border-white/60 transition-colors duration-200"
                >
                  <span className="font-body font-normal text-[18px] leading-[115%] tracking-[-0.02em] text-white">
                    BACK TO HOME
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <Top3Leaderboard
          entries={top3Entries.map((e) => ({
            username: e.user?.username ?? "anon",
            pfpUrl: e.user?.pfpUrl ?? "",
            score: e.score,
          }))}
          gameId={gameId}
        />
      </div>
      <BottomNav />
    </>
  );
}
