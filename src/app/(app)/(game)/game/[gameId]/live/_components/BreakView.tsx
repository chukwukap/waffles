"use client";

import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import CircularProgress from "./CircularProgress";
import { LiveEventFeed } from "../../../_components/LiveEventFeed";
import { GameChat } from "../../../_components/chat/GameChat";
import { useLiveGame } from "../LiveGameProvider";

// ==========================================
// TYPES
// ==========================================

interface BreakViewProps {
    seconds: number;
    nextRoundNumber: number;
    totalDuration?: number;
}

interface LeaderboardEntry {
    rank: number;
    userId: number;
    fid: number;
    username: string | null;
    pfpUrl: string | null;
    score: number;
}

// ==========================================
// COMPONENT
// ==========================================

export default function BreakView({
    seconds,
    nextRoundNumber,
    totalDuration = 15,
}: BreakViewProps) {
    const { gameId } = useLiveGame();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const percentage = Math.max(0, Math.min(100, (seconds / totalDuration) * 100));

    // Fetch leaderboard when break view mounts
    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const res = await sdk.quickAuth.fetch(`/api/v1/games/${gameId}/leaderboard?limit=10`);
                if (res.ok) {
                    const data = await res.json();
                    setLeaderboard(data.leaderboard || []);
                }
            } catch (e) {
                console.error("Failed to fetch leaderboard:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchLeaderboard();
    }, [gameId]);

    return (
        <div className="flex flex-col h-full w-full">
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="flex flex-col items-center w-full max-w-lg mx-auto px-3 sm:px-4 pt-4 gap-2 sm:gap-3 font-body">
                    {/* Header */}
                    <div className="text-center">
                        <span className="text-white/80 text-base sm:text-[18px] font-medium uppercase tracking-tight">
                            please wait
                        </span>
                    </div>

                    {/* Title + Timer Row */}
                    <div className="relative flex items-center justify-between w-full my-4">
                        <h1 className="text-white text-[36px] leading-[0.92] tracking-tight uppercase">
                            Next round in
                        </h1>

                        {/* Circular Timer */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2">
                            <div className="relative flex items-center justify-center w-12 h-12 sm:w-[60px] sm:h-[60px] md:w-[70px] md:h-[70px]">
                                <CircularProgress
                                    size={60}
                                    strokeWidth={4}
                                    color="#1B8FF5"
                                    percentage={percentage}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[#1B8FF5] text-lg sm:text-[22px] md:text-[24px] font-bold">
                                        {seconds}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="flex flex-col items-start p-2 sm:p-3 gap-1.5 sm:gap-2 w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl">
                        {loading ? (
                            <div className="text-white/60 text-center w-full py-2 text-sm sm:text-base">Loading...</div>
                        ) : leaderboard.length === 0 ? (
                            <div className="text-white/60 text-center w-full py-2 text-sm sm:text-base">No players yet</div>
                        ) : (
                            leaderboard.map((entry) => (
                                <div
                                    key={entry.userId}
                                    className="flex items-center gap-1.5 sm:gap-2 w-full py-0.5 sm:py-1"
                                >
                                    {/* Rank Badge */}
                                    <div className="flex justify-center items-center w-5 h-5 sm:w-6 sm:h-6 bg-white/10 rounded-full shrink-0">
                                        <span className="text-[10px] sm:text-[12px] text-white">
                                            {entry.rank}
                                        </span>
                                    </div>

                                    {/* Avatar */}
                                    {entry.pfpUrl ? (
                                        <img
                                            src={entry.pfpUrl}
                                            alt={entry.username || "User"}
                                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden shrink-0 object-cover"
                                        />
                                    ) : (
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#F0F3F4] overflow-hidden shrink-0" />
                                    )}

                                    {/* Username */}
                                    <span className="text-sm sm:text-base md:text-[18px] text-white truncate flex-1">
                                        {entry.username || `User ${entry.fid}`}
                                    </span>

                                    {/* Score */}
                                    <span className="text-xs sm:text-sm text-white/60 shrink-0">
                                        {entry.score.toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom section - always at bottom */}
            <div className="shrink-0 mt-auto">
                {/* Live Feed */}
                <div className="w-full max-w-lg mx-auto px-3 sm:px-4">
                    <LiveEventFeed />
                </div>

                {/* Chat */}
                <div className="w-full bg-[#0E0E0E] border-t border-white/10 px-3 sm:px-4 py-2 sm:py-3">
                    <div className="w-full max-w-lg mx-auto">
                        <GameChat />
                    </div>
                </div>
            </div>
        </div>
    );
}
