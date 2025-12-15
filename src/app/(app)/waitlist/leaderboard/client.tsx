"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { env } from "@/lib/env";

// ============================================
// TYPES
// ============================================
export interface LeaderboardEntry {
  rank: number;
  fid: number;
  username: string | null;
  pfpUrl: string | null;
  points: number;
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank: number | null;
  totalParticipants: number;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ============================================
// FLOATING PARTICLES - Blue themed
// ============================================
function LeaderboardParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Floating dots */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
          style={{
            left: `${10 + i * 9}%`,
            top: `${15 + (i % 5) * 18}%`,
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.1, 0.5, 0.1],
          }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
      {/* Glowing orbs */}
      <motion.div
        className="absolute w-56 h-56 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(27,143,245,0.08) 0%, transparent 70%)",
          right: "-15%",
          top: "10%",
        }}
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 70%)",
          left: "-10%",
          bottom: "20%",
        }}
        animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ============================================
// RANK MEDAL - For top 3
// ============================================
function RankMedal({ rank }: { rank: number }) {
  const medals: Record<number, { emoji: string; color: string }> = {
    1: { emoji: "🥇", color: "from-amber-500/30 to-amber-600/20" },
    2: { emoji: "🥈", color: "from-gray-400/30 to-gray-500/20" },
    3: { emoji: "🥉", color: "from-orange-600/30 to-orange-700/20" },
  };

  const medal = medals[rank];
  if (!medal) return null;

  return (
    <motion.div
      className={`absolute -top-1 -left-1 w-6 h-6 rounded-full bg-linear-to-br ${medal.color} flex items-center justify-center text-xs`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
    >
      {medal.emoji}
    </motion.div>
  );
}

// ============================================
// USER RANK BADGE - Sticky at top
// ============================================
function UserRankBadge({
  rank,
  total,
}: {
  rank: number;
  total: number;
}) {
  const percentile = Math.round(((total - rank) / total) * 100);

  return (
    <motion.div
      className="sticky top-0 z-20 pb-2 pt-1"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <motion.div
        className="bg-[#1B8FF5]/10 border border-[#1B8FF5]/40 rounded-xl px-4 py-3 backdrop-blur-md"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-full bg-[#1B8FF5]/20 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-[#1B8FF5] font-body text-lg">#{rank}</span>
            </motion.div>
            <div>
              <p className="text-white font-body text-sm">Your Rank</p>
              <p className="text-white/50 font-display text-xs">
                Top {100 - percentile}% of {total.toLocaleString()} players
              </p>
            </div>
          </div>
          <motion.div
            className="text-right"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-[#1B8FF5] font-body text-2xl">
              {percentile}%
            </span>
            <p className="text-white/40 font-display text-xs">percentile</p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// LEADERBOARD ROW - Individual entry
// ============================================
function LeaderboardRow({
  entry,
  index,
}: {
  entry: LeaderboardEntry;
  index: number;
}) {
  const isTopThree = entry.rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: Math.min(index * 0.05, 0.5), // Cap delay for long lists
      }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex items-center gap-3 px-3 py-3 rounded-xl border transition-all ${
        entry.isCurrentUser
          ? "border-[#1B8FF5]/60 bg-[#1B8FF5]/10"
          : "bg-white/[0.03] border-white/10"
      }`}
    >
      {/* Current user glow */}
      {entry.isCurrentUser && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-[#1B8FF5]/5 pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Medal for top 3 */}
      {isTopThree && <RankMedal rank={entry.rank} />}

      {/* Rank number */}
      <motion.div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isTopThree
            ? "bg-linear-to-br from-amber-500/20 to-amber-600/10"
            : "bg-white/10"
        }`}
        whileHover={{ scale: 1.1 }}
      >
        <span
          className={`font-body text-sm ${
            isTopThree ? "text-amber-400" : "text-white/70"
          }`}
        >
          {entry.rank}
        </span>
      </motion.div>

      {/* Avatar */}
      <motion.div
        className="relative w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0"
        whileTap={{ scale: 0.9, rotate: -10 }}
      >
        {entry.pfpUrl ? (
          <img
            src={entry.pfpUrl}
            alt={entry.username || `User ${entry.fid}`}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
            ?
          </div>
        )}
      </motion.div>

      {/* Username */}
      <div className="flex-1 min-w-0">
        <span className="font-body text-base text-white truncate block">
          {entry.username || `User ${entry.fid}`}
        </span>
        {entry.isCurrentUser && (
          <motion.span
            className="text-[#1B8FF5] font-display text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            That&apos;s you! 🎉
          </motion.span>
        )}
      </div>

      {/* Points */}
      <motion.div
        className="text-right shrink-0"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: Math.min(index * 0.05, 0.5) + 0.1 }}
      >
        <span
          className={`font-body text-lg ${
            entry.isCurrentUser ? "text-[#1B8FF5]" : "text-white/80"
          }`}
        >
          {entry.points.toLocaleString()}
        </span>
        <span className="text-white/40 font-display text-xs ml-1">PTS</span>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// LOADING SPINNER
// ============================================
function LoadingSpinner() {
  return (
    <div className="py-6 flex flex-col items-center gap-2">
      <motion.div
        className="w-6 h-6 border-2 border-[#1B8FF5]/30 border-t-[#1B8FF5] rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <span className="text-white/40 text-sm font-display">Loading more...</span>
    </div>
  );
}

// ============================================
// END OF LIST
// ============================================
function EndOfList() {
  return (
    <motion.div
      className="py-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.span
        className="text-2xl block mb-1"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🏁
      </motion.span>
      <span className="text-white/40 text-sm font-display">
        You&apos;ve reached the end
      </span>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export function LeaderboardClient({
  leaderboardPromise,
}: {
  leaderboardPromise: Promise<LeaderboardData>;
}) {
  const initialData = use(leaderboardPromise);
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialData.entries);
  const [hasMore, setHasMore] = useState(initialData.pagination?.hasMore ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(100);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${env.rootUrl}/api/v1/waitlist/leaderboard?limit=100&offset=${offset}`,
        { cache: "no-store" }
      );

      if (!response.ok) throw new Error("Failed to fetch more data");

      const data: LeaderboardData = await response.json();

      if (data.entries.length === 0) {
        setHasMore(false);
      } else {
        setEntries((prev) => [...prev, ...data.entries]);
        setOffset((prev) => prev + data.entries.length);
        setHasMore(data.pagination?.hasMore ?? false);
      }
    } catch (error) {
      console.error("Error loading more leaderboard entries:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, offset]);

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
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* Background particles */}
      <LeaderboardParticles />

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-2">
        <div className="w-full max-w-lg mx-auto space-y-3">
          {/* User's rank badge */}
          {initialData.userRank && (
            <UserRankBadge
              rank={initialData.userRank}
              total={initialData.totalParticipants}
            />
          )}

          {/* Leaderboard entries */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {entries.map((entry, index) => (
              <LeaderboardRow
                key={`${entry.fid}-${index}`}
                entry={entry}
                index={index}
              />
            ))}
          </motion.div>

          {/* Loading indicator */}
          <AnimatePresence>
            {hasMore && (
              <div ref={observerTarget}>
                {isLoading && <LoadingSpinner />}
              </div>
            )}
          </AnimatePresence>

          {/* End of list */}
          <AnimatePresence>
            {!hasMore && entries.length > 0 && <EndOfList />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
