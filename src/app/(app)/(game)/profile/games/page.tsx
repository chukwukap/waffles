"use client";

import { useProfileGames } from "@/hooks/useProfileGames";
import { cn } from "@/lib/utils";
import GameHistoryItem from "./_components/GameHistoryItem";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";
import { SubHeader } from "@/components/ui/SubHeader";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// COMPONENT
// ==========================================

export default function GamesPage() {
  const { games, isLoading } = useProfileGames(); // No limit = all games

  if (isLoading) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex items-center justify-center"
        >
          <WaffleLoader text="LOADING GAMES..." />
        </motion.div>
        <BottomNav />
      </AnimatePresence>
    );
  }

  // Transform to expected format
  const gameHistory = games.map((g) => ({
    id: g.gameId,
    onchainId: g.game.onchainId,
    name: g.game.title,
    score: g.score,
    claimedAt: g.claimedAt ? new Date(g.claimedAt) : null,
    prizeAmount: g.prize,
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  } as const;

  return (
    <>
      <SubHeader title="GAME HISTORY" />
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "mx-auto w-full max-w-lg flex-1",
          "px-4",
          "mt-4"
        )}
      >
        {gameHistory.length > 0 ? (
          <motion.ul
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3.5"
          >
            {gameHistory.map((g) => (
              <motion.li
                key={g.id}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 },
                }}
              >
                <GameHistoryItem game={g} />
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center py-6 px-4 border border-white/10 rounded-2xl bg-white/5"
          >
            <p className="font-display text-sm text-white/40 text-center">
              No games played yet
            </p>
          </motion.div>
        )}
      </motion.main>
      <BottomNav />
    </>
  );
}
