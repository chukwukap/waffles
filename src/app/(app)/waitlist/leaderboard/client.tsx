"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
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
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3 + (i % 3),
            height: 3 + (i % 3),
            background:
              i % 2 === 0
                ? "rgba(27, 143, 245, 0.25)"
                : "rgba(251, 191, 36, 0.15)",
            left: `${8 + i * 9}%`,
            top: `${10 + (i % 5) * 20}%`,
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
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
    </div>
  );
}

// ============================================
// RANK MEDAL - For top 3
// ============================================
function RankMedal({ rank }: { rank: number }) {
  const medals: Record<number, { emoji: string }> = {
    1: { emoji: "🥇" },
    2: { emoji: "🥈" },
    3: { emoji: "🥉" },
  };

  const medal = medals[rank];
  if (!medal) return null;

  return (
    <motion.span
      className="text-sm"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.1 }}
    >
      {medal.emoji}
    </motion.span>
  );
}

// ============================================
// LEADERBOARD ROW - Fixed height 47px
// ============================================
function LeaderboardRow({
  entry,
  index,
  isFloating = false,
}: {
  entry: LeaderboardEntry;
  index: number;
  isFloating?: boolean;
}) {
  const isTopThree = entry.rank <= 3;
  const delay = isFloating ? 0 : Math.min(index * 0.03, 0.3);

  return (
    <motion.div
      initial={isFloating ? { opacity: 0, y: 20 } : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={isFloating ? { opacity: 0, y: 20 } : undefined}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay,
      }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex items-center gap-3 px-3 h-[47px] rounded-xl border transition-colors ${
        entry.isCurrentUser
          ? "border-[#1B8FF5]/50 bg-[#1B8FF5]/10"
          : isTopThree
          ? "bg-amber-500/5 border-amber-500/20"
          : "bg-white/2 border-white/6"
      }`}
    >
      {/* Current user glow */}
      {entry.isCurrentUser && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-[#1B8FF5]/5 pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Rank */}
      <div className="w-8 flex items-center justify-center shrink-0">
        {isTopThree ? (
          <RankMedal rank={entry.rank} />
        ) : (
          <span className="text-white/50 font-body text-sm">{entry.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0">
        {entry.pfpUrl ? (
          <Image
            src={entry.pfpUrl}
            alt={entry.username || `User ${entry.fid}`}
            width={32}
            height={32}
            className="object-cover w-full h-full"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
            ?
          </div>
        )}
      </div>

      {/* Username */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="font-body text-[15px] text-white truncate">
          {entry.username || `User ${entry.fid}`}
        </span>
        {entry.isCurrentUser && (
          <span className="text-[#1B8FF5]/80 font-display text-xs shrink-0">
            (YOU)
          </span>
        )}
      </div>

      {/* Points */}
      <div className="text-right shrink-0">
        <span
          className={`font-body text-[15px] ${
            entry.isCurrentUser ? "text-[#1B8FF5]" : "text-white/70"
          }`}
        >
          {entry.points.toLocaleString()}
        </span>
        <span className="text-white/40 font-display text-xs ml-1">PTS</span>
      </div>
    </motion.div>
  );
}

// ============================================
// FLOATING CURRENT USER ROW - Shows at bottom when scrolled past
// ============================================
function FloatingUserRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-2 bg-linear-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="max-w-lg mx-auto">
        <LeaderboardRow entry={entry} index={0} isFloating />
      </div>
    </motion.div>
  );
}

// ============================================
// LOADING SPINNER
// ============================================
function LoadingSpinner() {
  return (
    <motion.div
      className="py-6 flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-6 h-6 border-2 border-[#1B8FF5]/20 border-t-[#1B8FF5] rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
      <span className="text-white/40 text-xs font-display">Loading...</span>
    </motion.div>
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
      <span className="text-white/30 text-xs font-display">End of list</span>
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
  const [showFloatingUser, setShowFloatingUser] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const currentUserRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Find current user entry
  const currentUserEntry = entries.find((e) => e.isCurrentUser);

  // Track if current user row is visible
  useEffect(() => {
    if (!currentUserRef.current || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingUser(!entry.isIntersecting);
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.1,
      }
    );

    observer.observe(currentUserRef.current);
    return () => observer.disconnect();
  }, [entries]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${env.rootUrl}/api/v1/waitlist/leaderboard?limit=100&offset=${offset}`,
        { cache: "no-store" }
      );

      if (!response.ok) throw new Error("Failed to fetch more data");

      const fetchedData: LeaderboardData = await response.json();

      if (fetchedData.entries.length === 0) {
        setHasMore(false);
      } else {
        setEntries((prev) => [...prev, ...fetchedData.entries]);
        setOffset((prev) => prev + fetchedData.entries.length);
        setHasMore(fetchedData.pagination?.hasMore ?? false);
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
      (observerEntries) => {
        if (observerEntries[0].isIntersecting && hasMore && !isLoading) {
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
      <div
        ref={scrollContainerRef}
        className="relative z-10 flex-1 overflow-y-auto px-4 py-2"
      >
        <div className="w-full max-w-lg mx-auto space-y-2">
          {/* Leaderboard entries */}
          {entries.map((entry, index) => (
            <div
              key={`${entry.fid}-${index}`}
              ref={entry.isCurrentUser ? currentUserRef : undefined}
            >
              <LeaderboardRow entry={entry} index={index} />
            </div>
          ))}

          {/* Loading indicator */}
          <AnimatePresence mode="wait">
            {hasMore && (
              <div ref={observerTarget}>{isLoading && <LoadingSpinner />}</div>
            )}
          </AnimatePresence>

          {/* End of list */}
          <AnimatePresence>
            {!hasMore && entries.length > 0 && <EndOfList />}
          </AnimatePresence>

          {/* Spacer for floating row */}
          {currentUserEntry && <div className="h-16" />}
        </div>
      </div>

      {/* Floating current user row */}
      <AnimatePresence>
        {showFloatingUser && currentUserEntry && (
          <FloatingUserRow entry={currentUserEntry} />
        )}
      </AnimatePresence>
    </div>
  );
}
