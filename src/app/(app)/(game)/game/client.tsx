"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useUser } from "@/hooks/useUser";
import { useGame } from "./GameProvider";
import { getGamePhase } from "@/lib/game-utils";
import { useTimer } from "@/hooks/useTimer";
import { useLive } from "@/hooks/useLive";
import { useSounds } from "@/hooks/useSounds";
import { BottomNav } from "@/components/BottomNav";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { springs, staggerContainer, fadeInUp } from "@/lib/animations";

import { GameChat } from "./_components/chat/GameChat";
import { LiveEventFeed } from "./_components/LiveEventFeed";
import { NextGameCard } from "./_components/NextGameCard";
import { CheerOverlay } from "./_components/CheerOverlay";

import type { GamePageData } from "./page";

// ==========================================
// PROPS
// ==========================================

interface GameHubProps {
  game: GamePageData | null;
}

// ==========================================
// COMPONENT
// ==========================================

export function GameHub({ game }: GameHubProps) {
  const router = useRouter();
  const hasRefreshedRef = useRef(false);

  // User data and access check
  const { user, isLoading: isLoadingUser } = useUser();

  // Entry from GameProvider context
  const { entry, isLoading: isLoadingEntry, refetchEntry } = useGame();

  // Derive phase from game (not stored)
  const phase = useMemo(() => (game ? getGamePhase(game) : "SCHEDULED"), [game]);

  // Access control - redirect if no access
  useEffect(() => {
    if (isLoadingUser) return;
    if (!user || !user.hasGameAccess || user.isBanned) {
      router.replace("/redeem");
    }
  }, [user, isLoadingUser, router]);

  // Real-time connection
  const hasAccess = !!user?.hasGameAccess && !user?.isBanned;
  useLive({
    gameId: game?.id ?? 0,
    enabled: !!game && hasAccess,
  });

  // Background music
  const { playBgMusic, stopBgMusic } = useSounds();

  // Countdown
  const targetMs = game?.startsAt.getTime() ?? 0;
  const countdown = useTimer(targetMs);

  // Refresh page when countdown reaches 0 to get fresh server data
  useEffect(() => {
    if (countdown <= 0 && phase === "SCHEDULED" && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      router.refresh();
    }
  }, [countdown, phase, router]);

  // Derived state - also check countdown for immediate transition
  const isLive = phase === "LIVE" || (countdown <= 0 && phase !== "ENDED");
  const hasEnded = phase === "ENDED";
  const isEmpty = !game;
  const hasActiveGame = !isEmpty && !hasEnded;

  // Background music control
  useEffect(() => {
    if (hasAccess && hasActiveGame) {
      playBgMusic();
    } else {
      stopBgMusic();
    }
    return () => {
      stopBgMusic();
    };
  }, [hasAccess, hasActiveGame, playBgMusic, stopBgMusic]);

  // ==========================================
  // RENDER: Loading - only show if no access after hydration
  // ==========================================

  // Skip showing loading for initial data fetch - loading.tsx handles that
  // Only show if user doesn't have access after we know who they are
  if (!isLoadingUser && (!hasAccess || !user)) {
    return (
      <>
        <main className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springs.gentle}
          >
            <WaffleLoader text="Checking access..." />
          </motion.div>
        </main>
        <BottomNav />
      </>
    );
  }

  // ==========================================
  // RENDER: Empty State
  // ==========================================

  if (isEmpty) {
    return (
      <>
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex-1 overflow-y-auto px-4 py-2"
        >
          <div className="flex flex-col items-center justify-center gap-6 py-16">
            <motion.div variants={fadeInUp} className="text-center space-y-2">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, ...springs.bouncy }}
                className="text-white font-body text-2xl"
              >
                NO GAMES YET
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/50 font-display text-sm max-w-[280px]"
              >
                New games are coming soon. Check back later!
              </motion.p>
            </motion.div>
          </div>
        </motion.section>
        <BottomNav />
      </>
    );
  }

  // ==========================================
  // RENDER: Active Game
  // ==========================================

  return (
    <>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col justify-center items-center overflow-hidden px-4 py-4"
      >
        <NextGameCard
          gameId={game.id}
          onchainId={game.onchainId as `0x${string}` | null}
          theme={game.theme}
          themeIcon={game.coverUrl ?? undefined}
          tierPrices={game.tierPrices}
          countdown={countdown}
          hasTicket={!!entry?.paidAt}
          isLive={isLive}
          hasEnded={hasEnded}
          prizePool={game.prizePool ?? 0}
          spotsTotal={game.maxPlayers ?? 100}
          spotsTaken={game.playerCount ?? 0}
          username={user?.username ?? undefined}
          userAvatar={user?.pfpUrl ?? undefined}
          onPurchaseSuccess={refetchEntry}
        />
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...springs.gentle }}
        className="shrink-0 w-full px-4"
      >
        <LiveEventFeed />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, ...springs.gentle }}
        className="shrink-0 w-full bg-[#0E0E0E] border-t border-white/10 px-4 py-3"
      >
        <div className="w-full max-w-lg mx-auto">
          <GameChat />
        </div>
      </motion.div>

      <BottomNav />
      <CheerOverlay />
    </>
  );
}

