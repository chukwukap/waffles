"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

import { TabKey } from "./page";
import { Tabs, LeaderboardTabKey } from "./_components/Tabs";
import { Top3 } from "./_components/Top3";
import { Row } from "./_components/Row";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { motion, AnimatePresence } from "framer-motion";
import { useLeaderboard } from "@/hooks/useLeaderboard";

// ==========================================
// CONSTANTS
// ==========================================
const CROWN_HEIGHT = 180; // Height at which crown fully fades

// ==========================================
// TYPES
// ==========================================
interface LeaderboardClientProps {
  activeTab: TabKey;
  gameId?: number;
}

// ==========================================
// COMPONENT
// ==========================================
export default function LeaderboardClient({
  activeTab,
  gameId,
}: LeaderboardClientProps) {
  // Get user FID from MiniKit context
  const { context } = useMiniKit();
  const userFid = context?.user?.fid ?? null;

  // Use the SWR hook
  const {
    entries,
    hasMore,
    totalPlayers,
    loadMore,
    isLoading,
    isLoadingMore,
    error,
  } = useLeaderboard(activeTab, gameId);

  // ============================================
  // STATE
  // ============================================
  const [crownOpacity, setCrownOpacity] = useState(1);
  const [isSticky, setIsSticky] = useState(false);

  // ============================================
  // REFS
  // ============================================
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // ============================================
  // EFFECTS
  // ============================================

  // Reset scroll position when tab changes
  useEffect(() => {
    setCrownOpacity(1);
    setIsSticky(false);

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab, gameId]);

  // Infinite scroll observer
  useEffect(() => {
    const el = loaderRef.current;
    if (!el || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  // ============================================
  // HANDLERS
  // ============================================

  // Simple, rock-solid scroll handler for crown fade + sticky detection
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    // Calculate opacity: 1 at top, 0 when scrolled past CROWN_HEIGHT
    const newOpacity = Math.max(0, Math.min(1, 1 - scrollTop / CROWN_HEIGHT));
    setCrownOpacity(newOpacity);
    // Track if header is stuck (when crown is fully faded)
    setIsSticky(scrollTop >= CROWN_HEIGHT);
  }, []);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // User's entry if they're not in top 3
  const userEntry = entries.find((e) => e.fid === userFid);
  const showUserEntry = userEntry && userEntry.rank > 3;

  return (
    <div className="flex h-full flex-col bg-background relative">
      {/* Tabs - Sticky at top */}
      <Tabs activeTab={activeTab as LeaderboardTabKey} fid={userFid} />

      {/* Scrollable content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Top 3 Crown (fades out on scroll) */}
        {top3.length > 0 && (
          <div
            className="relative shrink-0"
            style={{
              opacity: crownOpacity,
              pointerEvents: crownOpacity === 0 ? "none" : "auto",
            }}
          >
            <Top3 entries={top3} />
          </div>
        )}

        {/* Main leaderboard list */}
        <div className="flex flex-col px-4 pb-24 gap-2">
          {/* Show loading on initial fetch */}
          {isLoading && entries.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <WaffleLoader text="LOADING LEADERBOARD..." />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          ) : entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center py-12 px-4 border border-white/10 rounded-2xl bg-white/5"
            >
              <p className="font-display text-sm text-white/40 text-center">
                No entries yet
              </p>
            </motion.div>
          ) : (
            <>
              {/* Total Players Count */}
              {totalPlayers != null && totalPlayers > 0 && (
                <div className="flex justify-between items-center mb-2 px-3 py-2">
                  <span className="font-display text-sm text-muted">
                    Total Players
                  </span>
                  <span className="font-body text-base text-white">
                    {totalPlayers.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Leaderboard rows (excluding top 3) */}
              <AnimatePresence mode="wait">
                {rest.map((entry) => (
                  <Row
                    key={`${entry.id}-${entry.rank}`}
                    entry={entry}
                    isCurrentUser={entry.fid === userFid}
                  />
                ))}
              </AnimatePresence>

              {/* User's entry if not in top 3 and not visible */}
              {showUserEntry && userEntry.rank > rest.length + 3 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-xs text-muted mb-2 px-3">Your Rank</p>
                  <Row entry={userEntry} isCurrentUser />
                </div>
              )}

              {/* Loading more indicator */}
              <div ref={loaderRef} className="py-4">
                {isLoadingMore && (
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-waffle-yellow border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
