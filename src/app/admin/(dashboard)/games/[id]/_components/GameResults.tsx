"use client";

import Link from "next/link";
import {
    TrophyIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

// ============================================
// TYPES
// ============================================

interface GameResultsProps {
    gameId: string;
    gameTitle: string;
    totalEntries: number;
    prizePool: number;
    winners: Array<{
        rank: number;
        username: string | null;
        score: number;
        prize: number | null;
        pfpUrl: string | null;
    }>;
    totalWinners: number;
}

// ============================================
// COMPONENT
// ============================================

export function GameResults({
    gameId,
    gameTitle,
    totalEntries,
    prizePool,
    winners,
    totalWinners,
}: GameResultsProps) {
    const totalPayout = winners.reduce((sum, w) => sum + (w.prize || 0), 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <TrophyIcon className="h-5 w-5 text-[#FFC931]" />
                <h3 className="text-lg font-bold text-white font-display">
                    Game Results
                </h3>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                        <UserGroupIcon className="h-3.5 w-3.5" />
                        Entries
                    </div>
                    <p className="text-xl font-bold text-white">{totalEntries}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                        <CurrencyDollarIcon className="h-3.5 w-3.5" />
                        Prize Pool
                    </div>
                    <p className="text-xl font-bold text-[#14B985]">
                        ${prizePool.toLocaleString()}
                    </p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                        <TrophyIcon className="h-3.5 w-3.5" />
                        Winners
                    </div>
                    <p className="text-xl font-bold text-[#FFC931]">{totalWinners}</p>
                </div>
            </div>

            {/* Top Winners */}
            {winners.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white/60">Top Winners</h4>
                    <div className="space-y-2">
                        {winners.slice(0, 5).map((winner) => (
                            <div
                                key={winner.rank}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Rank Badge */}
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${winner.rank === 1
                                                ? "bg-[#FFC931]/20 text-[#FFC931]"
                                                : winner.rank === 2
                                                    ? "bg-[#C0C0C0]/20 text-[#C0C0C0]"
                                                    : winner.rank === 3
                                                        ? "bg-[#CD7F32]/20 text-[#CD7F32]"
                                                        : "bg-white/10 text-white/60"
                                            }`}
                                    >
                                        {winner.rank}
                                    </div>
                                    {/* Avatar */}
                                    {winner.pfpUrl ? (
                                        <img
                                            src={winner.pfpUrl}
                                            alt=""
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white/60 text-sm font-medium">
                                            {winner.username?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                    )}
                                    {/* Username & Score */}
                                    <div>
                                        <p className="text-white font-medium text-sm">
                                            @{winner.username || "Unknown"}
                                        </p>
                                        <p className="text-white/50 text-xs">
                                            {winner.score} pts
                                        </p>
                                    </div>
                                </div>
                                {/* Prize */}
                                <div className="text-right">
                                    <p className="text-[#14B985] font-bold">
                                        ${(winner.prize || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* View Full Link */}
            <Link
                href={`/game/${gameId}/result`}
                className="block text-center py-2 text-[#FFC931] hover:underline text-sm font-medium"
            >
                View Full Leaderboard →
            </Link>

            {/* Total Payout Summary */}
            <div className="p-3 bg-[#14B985]/10 rounded-xl border border-[#14B985]/30">
                <div className="flex items-center justify-between">
                    <span className="text-[#14B985]/80 text-sm">
                        Total Payout (Top 5)
                    </span>
                    <span className="text-[#14B985] font-bold">
                        ${totalPayout.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
