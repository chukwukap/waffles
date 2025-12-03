"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { LeaderboardData, LeaderboardEntry } from "@/app/api/leaderboard/route";
import Image from "next/image";
import { motion } from "framer-motion";
import { env } from "@/lib/env";

export function LeaderboardClient({ leaderboardPromise }: { leaderboardPromise: Promise<LeaderboardData> }) {
    const initialData = use(leaderboardPromise);
    const [entries, setEntries] = useState<LeaderboardEntry[]>(initialData.entries);
    const [hasMore, setHasMore] = useState(initialData.entries.length === 100); // Assuming 100 is the limit per load
    const [isLoading, setIsLoading] = useState(false);
    const [offset, setOffset] = useState(100); // Start from the next batch
    const observerTarget = useRef<HTMLDivElement>(null);

    // Extract FID from the entries (current user's FID)
    const currentUserFid = initialData.entries.find(e => e.isCurrentUser)?.fid;

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const response = await fetch(
                `${env.rootUrl}/api/waitlist/leaderboard?fid=${currentUserFid || ''}&limit=100&offset=${offset}`,
                { cache: 'no-store' }
            );

            if (!response.ok) throw new Error("Failed to fetch more data");

            const data: LeaderboardData = await response.json();

            if (data.entries.length === 0) {
                setHasMore(false);
            } else {
                setEntries(prev => [...prev, ...data.entries]);
                setOffset(prev => prev + data.entries.length);
                setHasMore(data.entries.length === 100);
            }
        } catch (error) {
            console.error("Error loading more leaderboard entries:", error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, offset, currentUserFid]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, isLoading, loadMore]);

    return (
        <div className="w-full px-4 mx-auto flex-1 overflow-y-auto max-w-lg py-1 space-y-3">
            {/* User's rank display at the top if they exist */}
            {initialData.userRank && (
                <div className="sticky top-0 z-10 pb-2 pt-1">
                    <div className="bg-[#1B8FF514] border border-[#1B8FF599] rounded-[12px] px-3 py-2 backdrop-blur-sm">
                        <p className="text-white/60 text-[12px] font-body">
                            Your rank: <span className="text-[#1B8FF5] font-medium">#{initialData.userRank}</span> of {initialData.totalParticipants}
                        </p>
                    </div>
                </div>
            )}

            {/* Leaderboard entries */}
            {entries.map((entry, index) => (
                <LeaderboardRow key={entry.fid + "-" + index} entry={entry} />
            ))}

            {/* Loading indicator and intersection observer target */}
            {hasMore && (
                <div ref={observerTarget} className="py-4 flex justify-center">
                    {isLoading && (
                        <div className="text-white/40 text-sm font-body">Loading more...</div>
                    )}
                </div>
            )}

            {/* End of list indicator */}
            {!hasMore && entries.length > 0 && (
                <div className="py-4 text-center text-white/40 text-sm font-body">
                    You've reached the end
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
                    <img
                        src={entry.pfpUrl}
                        alt={entry.username || `User ${entry.fid}`}
                        className="object-cover w-full h-full"
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

