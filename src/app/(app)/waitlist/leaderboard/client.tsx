"use client";

import { use } from "react";
import { LeaderboardData, LeaderboardEntry } from "@/app/api/waitlist/leaderboard/route";
import Image from "next/image";
import { motion } from "framer-motion";

export function LeaderboardClient({ leaderboardPromise }: { leaderboardPromise: Promise<LeaderboardData> }) {
    const data = use(leaderboardPromise);

    return (
        <div className="w-full px-4 mx-auto flex-1 overflow-y-auto max-w-lg py-1 space-y-3">

            {/* {Array.from({ length: 100 }).map((_, index) => (
                <LeaderboardRow key={data.topUsers[index % data.topUsers.length].fid + "-" + index} entry={data.topUsers[index % data.topUsers.length]} />
            ))} */}
            {data.topUsers.map((entry, index) => (
                <LeaderboardRow key={entry.fid + "-" + index} entry={entry} />
            ))}


            {data.currentUser && data.currentUser.points === 0 && (
                <>
                    {/* Delimiter for users with 0 points */}
                    <div className="my-4">
                        <div className="max-w-lg mx-auto h-1 bg-[#D9D9D9] opacity-10" style={{ height: '4px' }} />
                    </div>
                    <div className="">
                        <div className="max-w-lg mx-auto">
                            <LeaderboardRow entry={data.currentUser} />
                        </div>
                    </div>
                </>
            )}

            {data.currentUser && data.currentUser.points > 0 && !data.currentUser.isCurrentUser && (
                <div className="sticky bottom-0 backdrop-blur-sm border-t border-white/20 px-4 py-4 mt-4">
                    <div className="max-w-md mx-auto">
                        <LeaderboardRow entry={data.currentUser} />
                    </div>
                </div>
            )}
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

