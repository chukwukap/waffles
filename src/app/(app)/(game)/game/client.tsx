"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useUser } from "@/hooks/useUser";
import { useGame } from "@/components/providers/GameProvider";
import { BottomNav } from "@/components/BottomNav";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { springs, staggerContainer, fadeInUp } from "@/lib/animations";
import { getGamePhase } from "@/lib/types";

import { GameChat } from "./_components/chat/GameChat";
import { LiveEventFeed } from "./_components/LiveEventFeed";
import { NextGameCard } from "./_components/NextGameCard";
import { CheerOverlay } from "./_components/CheerOverlay";
import { useSounds } from "@/components/providers/SoundProvider";

// ==========================================
// COMPONENT
// ==========================================

export function GameHub() {
  const router = useRouter();
  const hasRefreshedRef = useRef(false);

  // Get game from context (fetched at layout level)
  const { state: { game } } = useGame();

  // User data
  const { user, isLoading: isLoadingUser } = useUser();
  const hasAccess = !!user?.hasGameAccess && !user?.isBanned;

  // Background music
  const { playBgMusic, stopBgMusic } = useSounds();

  // Derived state
  const phase = game ? getGamePhase(game) : "SCHEDULED";
  const hasActiveGame = game && phase !== "ENDED";

  // Access control redirect
  useEffect(() => {
    if (!isLoadingUser && (!user || !user.hasGameAccess || user.isBanned)) {
      router.replace("/redeem");
    }
  }, [user, isLoadingUser, router]);

  // Auto-refresh when game should start
  useEffect(() => {
    if (!game || phase !== "SCHEDULED") return;

    const msUntilStart = game.startsAt.getTime() - Date.now();
    if (msUntilStart <= 0 && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      router.refresh();
    }
  }, [game, phase, router]);

  // Background music
  useEffect(() => {
    if (hasAccess && hasActiveGame) {
      playBgMusic();
    } else {
      stopBgMusic();
    }
    return () => stopBgMusic();
  }, [hasAccess, hasActiveGame, playBgMusic, stopBgMusic]);

  // ==========================================
  // RENDER: Loading
  // ==========================================

  if (!isLoadingUser && !hasAccess) {
    // Don't show BottomNav during access check - prevents bypass
    return (
      <main className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.gentle}
        >
          <WaffleLoader text="Checking access..." />
        </motion.div>
      </main>
    );
  }

  // ==========================================
  // RENDER: Empty State
  // ==========================================

  if (!game) {
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
        className="shrink-0 flex flex-col justify-start items-center overflow-hidden px-4 pt-4"
      >
        <NextGameCard />
      </motion.section>

      {/* Live Event Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...springs.gentle }}
        className="flex-1 flex flex-col justify-end w-full px-4"
        style={{ minHeight: "clamp(60px, 12vh, 180px)" }}
      >
        <LiveEventFeed />
      </motion.div>

      {/* Game Chat */}
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
