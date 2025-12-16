"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GamePadIcon, ZapIcon } from "@/components/icons";

interface PastGame {
    id: number;
    title: string;
    playerCount: number;
    prizePool: number;
}

interface PastGamesCardProps {
    games: PastGame[];
}

/**
 * Past Games scrollable card matching Figma design
 * Dark gradient background with game rows
 */
export function PastGamesCard({ games }: PastGamesCardProps) {
    if (games.length === 0) return null;

    return (
        <div className="w-full rounded-2xl bg-linear-to-b from-[#2A2A3A] to-[#1A1A2A] p-4 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-2xl" role="img" aria-label="Game controller">
                    🎮
                </span>
                <h3 className="text-white font-body text-xl uppercase tracking-wide">
                    PAST GAMES
                </h3>
            </div>

            {/* Games List - scrollable */}
            <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {games.map((game) => (
                    <Link key={game.id} href={`/game/${game.id}`}>
                        <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            {/* Game Icon */}
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                <GamePadIcon className="w-5 h-5" />
                            </div>

                            {/* Game Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-body text-base truncate">
                                    {game.title}
                                </h4>
                                <div className="flex items-center gap-4 mt-0.5">
                                    {/* Players */}
                                    <span className="flex items-center gap-1 text-white/60 text-xs font-display">
                                        <span className="text-sm">👥</span>
                                        {game.playerCount}
                                    </span>
                                    {/* Prize */}
                                    <span className="flex items-center gap-1 text-amber-400 text-xs font-display">
                                        <ZapIcon className="w-3 h-3" />$
                                        {game.prizePool.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
