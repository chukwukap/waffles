"use client";
import Link from "next/link";
import GameHistoryItem from "./GameHistoryItem";
import { motion } from "framer-motion";

// Localized type
export interface GameHistoryEntry {
  id: number | string;
  onchainId: string | null;
  name: string;
  score: number;
  claimedAt: string | Date | null;
  prizeAmount: number;
}

interface GameHistoryProps {
  gameHistory: GameHistoryEntry[];
  fid: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.5
    }
  }
} as const;

export default function GameHistory({ gameHistory, fid }: GameHistoryProps) {
  // If on the dashboard snippet, show 3. If on full page, show all.
  // Ideally this component handles the full list rendering logic.
  const displayedGames = gameHistory;

  return (
    <section aria-labelledby="past-games-heading" className="w-full">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2
          id="past-games-heading"
          className="font-display font-medium text-[#99A0AE] tracking-[-0.03em] text-[14px]"
        >
          Recent Activity
        </h2>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/profile/games"
            className="font-display font-medium text-waffle-gold tracking-[-0.03em] hover:underline text-[14px]"
          >
            View all
          </Link>
        </motion.div>
      </div>

      {displayedGames.length > 0 ? (
        <motion.div
          className="flex flex-col w-full gap-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {displayedGames.map((game) => (
            <GameHistoryItem key={game.id} game={game} />
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-6 px-4 border border-white/10 rounded-2xl bg-white/5"
        >
          <p className="font-display text-sm text-white/40 text-center">
            No games played yet
          </p>
        </motion.div>
      )}
    </section>
  );
}