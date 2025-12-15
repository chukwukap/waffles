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
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3 + (i % 3),
            height: 3 + (i % 3),
            background:
              i % 2 === 0
                ? "rgba(27, 143, 245, 0.3)"
                : "rgba(251, 191, 36, 0.2)",
            left: `${8 + i * 7}%`,
            top: `${10 + (i % 5) * 20}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.15, 0.5, 0.15],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.25,
          }}
        />
      ))}

      {/* Large glowing orbs */}
      <motion.div
        className="absolute w-64 h-64 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(27,143,245,0.1) 0%, transparent 70%)",
          right: "-20%",
          top: "5%",
        }}
        animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)",
          left: "-15%",
          bottom: "15%",
        }}
        animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />
    </div>
  );
}

// ============================================
// RANK MEDAL - For top 3
// ============================================
function RankMedal({ rank }: { rank: number }) {
  const medals: Record<number, { emoji: string; glow: string }> = {
    1: { emoji: "🥇", glow: "shadow-amber-400/50" },
    2: { emoji: "🥈", glow: "shadow-gray-300/40" },
    3: { emoji: "🥉", glow: "shadow-orange-400/40" },
  };

  const medal = medals[rank];
  if (!medal) return null;

  return (
    <motion.div
      className={`absolute -top-1.5 -left-1.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-sm shadow-lg ${medal.glow}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.2 }}
    >
      <motion.span
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        {medal.emoji}
      </motion.span>
    </motion.div>
  );
}

// ============================================
// USER RANK BADGE - Sticky at top
// ============================================
function UserRankBadge({ rank, total }: { rank: number; total: number }) {
  const percentile = Math.round(((total - rank) / total) * 100);

  return (
    <motion.div
      className="sticky top-0 z-20 pb-3 pt-1"
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <motion.div
        className="relative bg-gradient-to-r from-[#1B8FF5]/15 to-[#1B8FF5]/5 border border-[#1B8FF5]/30 rounded-2xl px-4 py-4 backdrop-blur-md overflow-hidden"
        whileTap={{ scale: 0.98 }}
      >
        {/* Animated shine */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
        />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Rank circle */}
            <motion.div
              className="relative w-14 h-14 rounded-full bg-[#1B8FF5]/20 flex items-center justify-center border border-[#1B8FF5]/40"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span
                className="text-[#1B8FF5] font-body text-xl font-medium"
                key={rank}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                #{rank}
              </motion.span>
            </motion.div>

            <div>
              <p className="text-white font-body text-base">Your Rank</p>
              <motion.p
                className="text-white/50 font-display text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                Top {Math.max(1, 100 - percentile)}% of{" "}
                {total.toLocaleString()} players
              </motion.p>
            </div>
          </div>

          {/* Percentile */}
          <motion.div
            className="text-right"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <motion.span
              className="text-[#1B8FF5] font-body text-3xl font-medium"
              key={percentile}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {percentile}%
            </motion.span>
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
  const delay = Math.min(index * 0.04, 0.4);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 250,
        damping: 25,
        delay,
      }}
      whileTap={{ scale: 0.97 }}
      className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors ${
        entry.isCurrentUser
          ? "border-[#1B8FF5]/50 bg-gradient-to-r from-[#1B8FF5]/15 to-[#1B8FF5]/5"
          : isTopThree
            ? "bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/20"
            : "bg-white/[0.03] border-white/10 hover:bg-white/[0.05]"
      }`}
    >
      {/* Current user pulsing glow */}
      {entry.isCurrentUser && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-[#1B8FF5]/10 pointer-events-none"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Medal for top 3 */}
      {isTopThree && <RankMedal rank={entry.rank} />}

      {/* Rank number */}
      <motion.div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          isTopThree
            ? "bg-gradient-to-br from-amber-500/25 to-amber-600/10 border border-amber-500/30"
            : "bg-white/10"
        }`}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
      >
        <span
          className={`font-body text-sm font-medium ${
            isTopThree ? "text-amber-400" : "text-white/70"
          }`}
        >
          {entry.rank}
        </span>
      </motion.div>

      {/* Avatar */}
      <motion.div
        className="relative w-9 h-9 rounded-full overflow-hidden bg-white/10 shrink-0 ring-2 ring-white/10"
        whileTap={{ scale: 0.85, rotate: -15 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {entry.pfpUrl ? (
          <img
            src={entry.pfpUrl}
            alt={entry.username || `User ${entry.fid}`}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-sm font-display">
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
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.2 }}
          >
            That&apos;s you! 🎉
          </motion.span>
        )}
      </div>

      {/* Points */}
      <motion.div
        className="text-right shrink-0"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.1 }}
      >
        <span
          className={`font-body text-lg font-medium ${
            entry.isCurrentUser
              ? "text-[#1B8FF5]"
              : isTopThree
                ? "text-amber-400"
                : "text-white/80"
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
    <motion.div
      className="py-8 flex flex-col items-center gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-8 h-8 border-2 border-[#1B8FF5]/20 border-t-[#1B8FF5] rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
      <span className="text-white/40 text-sm font-display">Loading more...</span>
    </motion.div>
  );
}

// ============================================
// END OF LIST
// ============================================
function EndOfList({ count }: { count: number }) {
  return (
    <motion.div
      className="py-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <motion.span
        className="text-3xl block mb-2"
        animate={{ y: [0, -8, 0], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
      >
        🏁
      </motion.span>
      <span className="text-white/50 text-sm font-display">
        All {count.toLocaleString()} players loaded
      </span>
    </motion.div>
  );
}

// ============================================
// HEADER STATS
// ============================================
function HeaderStats({ total }: { total: number }) {
  return (
    <motion.div
      className="flex items-center justify-center gap-2 py-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <motion.span
        className="text-white/60 font-display text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        🏆
      </motion.span>
      <span className="text-white/60 font-display text-sm">
        <motion.span
          className="text-[#1B8FF5] font-body"
          key={total}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
        >
          {total.toLocaleString()}
        </motion.span>{" "}
        players competing
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
  const [entries, setEntries] = useState<LeaderboardEntry[]>(
    initialData.entries
  );
  const [hasMore, setHasMore] = useState(
    initialData.pagination?.hasMore ?? false
  );
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

      {/* Header stats */}
      <HeaderStats total={initialData.totalParticipants} />

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-4">
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
          <AnimatePresence mode="wait">
            {hasMore && (
              <div ref={observerTarget}>
                {isLoading && <LoadingSpinner />}
              </div>
            )}
          </AnimatePresence>

          {/* End of list */}
          <AnimatePresence>
            {!hasMore && entries.length > 0 && (
              <EndOfList count={entries.length} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
