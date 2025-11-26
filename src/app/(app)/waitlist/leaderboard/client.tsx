"use client";

import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { LeaderboardData, LeaderboardEntry } from "@/app/api/waitlist/leaderboard/route";
import Image from "next/image";
import { motion } from "framer-motion";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { SubHeader } from "@/components/ui/SubHeader";

export function LeaderboardHeader() {
    return (
        <SubHeader
            title="LEADERBOARD"
            className="h-[52px]"
            backButtonClassName="bg-transparent hover:bg-white/10"
        />
    );
}

export function LeaderboardClient() {
    const { context } = useMiniKit();
    const fid = context?.user?.fid;

    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchLeaderboard() {
            if (!fid) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/waitlist/leaderboard?fid=${fid}&limit=50`);
                if (!response.ok) throw new Error("Failed to fetch leaderboard");

                const leaderboardData: LeaderboardData = await response.json();
                setData(leaderboardData);
            } catch (err) {
                setError("Failed to load leaderboard");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchLeaderboard();
    }, [fid]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <WaffleLoader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <p className="text-white text-center">{error}</p>
            </div>
        );
    }

    return (
        <>
            <div className="px-4">
                <div className="max-w-md mx-auto space-y-2">
                    {data?.topUsers.map((entry) => (
                        <LeaderboardRow key={entry.fid} entry={entry} />
                    ))}
                </div>
            </div>

            {data?.currentUser && !data.currentUser.isCurrentUser && (
                <div className="sticky bottom-0 bg-[#191919]/90 backdrop-blur-sm border-t border-white/20 px-4 py-4 mt-4">
                    <div className="max-w-md mx-auto">
                        <LeaderboardRow entry={data.currentUser} />
                    </div>
                </div>
            )}
        </>
    );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all ${entry.isCurrentUser
                ? "bg-[#00CFF2]/10 border-[#00CFF2]"
                : "bg-white/5 border-white/10"
                }`}
        >
            {/* Left: Rank, Avatar, Username */}
            <div className="flex items-center gap-3">
                {/* Rank */}
                <span className="font-body text-white/60 text-[16px] w-6 text-center">
                    #{entry.rank}
                </span>

                {/* Avatar */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10">
                    {entry.pfpUrl ? (
                        <Image
                            src={entry.pfpUrl}
                            alt={entry.username || `User ${entry.fid}`}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
                            ?
                        </div>
                    )}
                </div>

                {/* Username */}
                <span className="font-display text-white text-[16px] font-medium">
                    {entry.username || `User ${entry.fid}`}
                </span>
            </div>

            {/* Right: Points */}
            <span className="font-body text-[#00CFF2] text-[20px]">
                {entry.points} PTS
            </span>
        </motion.div>
    );
}
