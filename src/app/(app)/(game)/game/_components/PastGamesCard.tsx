"use client";

import Link from "next/link";
import { formatPrizePool } from "@/lib/game-utils";
import type { PastGameData } from "../page";

// ==========================================
// PROPS
// ==========================================

interface PastGamesCardProps {
    games: PastGameData[];
}

// ==========================================
// COMPONENT
// ==========================================

export function PastGamesCard({ games }: PastGamesCardProps) {
    if (games.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <h3 className="text-white/50 font-display text-xs uppercase tracking-wider">
                Past Games
            </h3>
            <div className="space-y-2">
                {games.map((game) => (
                    <Link
                        key={game.id}
                        href={`/game/history/${game.id}`}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                        <div>
                            <p className="text-white font-body text-sm">{game.title}</p>
                            <p className="text-white/50 text-xs">
                                {game.playerCount} players • {game.theme}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[var(--color-neon-cyan)] font-body">
                                {formatPrizePool(game.prizePool)}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
            <Link
                href="/game/history"
                className="block text-center text-white/50 text-sm py-2 hover:text-white transition-colors"
            >
                View all games →
            </Link>
        </div>
    );
}
