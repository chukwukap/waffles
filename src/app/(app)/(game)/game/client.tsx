"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

import { springs, staggerContainer, fadeInUp } from "@/lib/animations";
import type { GameWithQuestionCount } from "@/lib/game";

import { GameChat } from "./_components/chat/GameChat";
import { LiveEventFeed } from "./_components/LiveEventFeed";
import { NextGameCard } from "./_components/NextGameCard";
import { CheerOverlay } from "./_components/CheerOverlay";
import { useSounds } from "@/components/providers/SoundProvider";

// ==========================================
// TYPES
// ==========================================

interface GameHubProps {
  /** Game data from server component - not stored in React state */
  game: GameWithQuestionCount | null;
}

// ==========================================
// COMPONENT
// ==========================================

export function GameHub({ game }: GameHubProps) {
  // Background music
  const { playBgMusic, stopBgMusic } = useSounds();

  // Derived state - check if game has ended by comparing current time to endsAt
  const hasEnded = game ? Date.now() >= game.endsAt.getTime() : true;
  const hasActiveGame = game && !hasEnded;

  // Background music control
  useEffect(() => {
    if (hasActiveGame) {
      playBgMusic();
    } else {
      stopBgMusic();
    }
    return () => stopBgMusic();
  }, [hasActiveGame, playBgMusic, stopBgMusic]);

  // ==========================================
  // RENDER: Empty State
  // ==========================================

  if (!game) {
    return (
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
        <NextGameCard game={game} />
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

      <CheerOverlay />
    </>
  );
}
