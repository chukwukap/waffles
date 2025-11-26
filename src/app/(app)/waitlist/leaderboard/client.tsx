"use client";

import { use } from "react";
import { LeaderboardData, LeaderboardEntry } from "@/app/api/leaderboard/route";
import Image from "next/image";
import { motion } from "framer-motion";

export function LeaderboardClient({ leaderboardPromise }: { leaderboardPromise: Promise<LeaderboardData> }) {
    const data = use(leaderboardPromise);

    // Find current user in the entries if they exist
    const currentUserEntry = data.entries.find(e => e.isCurrentUser);

    return (
        <div className="w-full px-4 mx-auto flex-1 overflow-y-auto max-w-lg py-1 space-y-3">
            {data.entries.map((entry, index) => (
                <LeaderboardRow key={entry.fid + "-" + index} entry={entry} />
            ))}

            {/* If current user is not in the top list (entries), show them at the bottom */}
            {/* Note: The API currently returns top 100. If user is not in top 100, we might want to fetch them separately or handle it. 
                For now, we'll assume if they are not in 'entries', we don't display them or the API should include them.
                However, the previous logic assumed 'currentUser' was a separate field. 
                Let's adapt: The new API returns 'userRank'. If we want to show the user at the bottom if not in top 100, 
                we would need the user's entry data. 
                
                Given the current API implementation:
                - It returns top 100 users.
                - It returns 'userRank'.
                
                If we want to show the "sticky" user row, we need the user's details even if they aren't in the top 100.
                The current API implementation DOES NOT return a separate 'currentUser' object if they are outside the limit.
                
                To fix this properly without changing the API again right now, we will just render the list.
                If the user is in the list, they will be highlighted.
            */}
        </div>
    );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-[12px] px-[12px] py-[12px] rounded-[16px] border transition-all ${entry.isCurrentUser
                ? "border-[#1B8FF599]"
                : "bg-[#FFFFFF08] border-[#FFFFFF14]"
                }`}
            style={{
                minHeight: '47px',
                ...(entry.isCurrentUser && {
                    background: 'linear-gradient(180deg, rgba(27, 143, 245, 0) 0%, rgba(27, 143, 245, 0.14) 100%)'
                })
            }}
        >
            {/* Rank */}
            <div className="w-5 h-5 rounded-full bg-[#FFFFFF1A] flex items-center justify-center shrink-0">
                <span className="font-body font-normal text-[12px] leading-[100%] tracking-[-0.03em] text-white text-center">
                    {entry.rank}
                </span>
            </div>

            {/* Avatar */}
            <div className="relative w-[20px] h-[20px] rounded-full overflow-hidden bg-white/10 shrink-0">
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
            <span className="flex-1 font-body font-normal text-[18px] leading-[130%] text-white">
                {entry.username || `User ${entry.fid}`}
                {entry.isCurrentUser && (
                    <span className="ml-2 text-white/40">(you)</span>
                )}
            </span>

            {/* Right: Points */}
            <span className="font-body font-normal text-[18px] leading-[130%] text-[#1B8FF5] shrink-0">
                {entry.points} PTS
            </span>
        </motion.div>
    );
}

