"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

import { LeaderboardData, TabKey } from "./page";
import { Tabs, LeaderboardTabKey } from "./_components/Tabs";
import { Top3 } from "./_components/Top3";
import { Row } from "./_components/Row";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { LeaderboardEntry } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// MOCK DATA - Set to false to disable
// ============================================
const USE_MOCK_DATA = true; // TODO: Set to false for production

function generateMockEntries(count: number): LeaderboardEntry[] {
  const names = ["CryptoKing", "WaffleQueen", "BlockchainBoss", "TokenMaster", "DeFiDegen", "NFTNinja", "ChainChamp", "MintMaster", "GasGuru", "StakeSlayer"];
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-${i + 1}`,
    rank: i + 1,
    fid: 100000 + i,
    username: names[i % names.length] + (i >= names.length ? `_${Math.floor(i / names.length)}` : ""),
    points: Math.max(10000 - i * 250, 100),
    pfpUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
  }));
}

const MOCK_ENTRIES = generateMockEntries(30);

// ============================================
// CONSTANTS
// ============================================
const CROWN_HEIGHT = 180; // Height at which crown fully fades

// ============================================
// TYPES
// ============================================
interface LeaderboardClientProps {
  initialData: LeaderboardData;
  activeTab: TabKey;
  gameId?: string;
}

// ============================================
// COMPONENT
// ============================================
export default function LeaderboardClient({
  initialData,
  activeTab,
  gameId,
}: LeaderboardClientProps) {
  // Get user FID from MiniKit context
  const { context } = useMiniKit();
  const userFid = context?.user?.fid ?? null;

  // Use mock data if enabled and real data is empty
  const effectiveData = USE_MOCK_DATA && initialData.entries.length === 0
    ? MOCK_ENTRIES
    : initialData.entries;

  // ============================================
  // STATE
  // ============================================
  const [entries, setEntries] = useState(effectiveData);
  const [hasMore, setHasMore] = useState(USE_MOCK_DATA && initialData.entries.length === 0 ? false : initialData.hasMore);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crownOpacity, setCrownOpacity] = useState(1);
  const [isSticky, setIsSticky] = useState(false);

  // ============================================
  // REFS
  // ============================================
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ============================================
  // EFFECTS
  // ============================================

  // Reset state when tab changes
  useEffect(() => {
    const data = USE_MOCK_DATA && initialData.entries.length === 0 ? MOCK_ENTRIES : initialData.entries;
    setEntries(data);
    setHasMore(USE_MOCK_DATA && initialData.entries.length === 0 ? false : initialData.hasMore);
    setPage(1);
    setError(null);
    setCrownOpacity(1);

    // Reset scroll position
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab, initialData]);

  // Infinite scroll observer
  useEffect(() => {
    const el = loaderRef.current;
    if (!el || !hasMore || isLoading) return;

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
  }, [hasMore, isLoading]);

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

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tab: activeTab,
        page: String(page),
      });
      if (gameId) params.set("gameId", String(gameId));

      const res = await fetch(`/api/v1/leaderboard?${params}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const data: LeaderboardData = await res.json();

      if (!controller.signal.aborted) {
        setEntries((prev) => [...prev, ...data.entries]);
        setHasMore(data.hasMore);
        setPage((prev) => prev + 1);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("[Leaderboard] Load more failed:", err);
      setError("Failed to load more. Try again.");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsLoading(false);
    }
  }, [isLoading, hasMore, activeTab, page, gameId]);

  // ============================================
  // COMPUTED
  // ============================================
  const isEmpty = entries.length === 0;
  const showTop3 = entries.length >= 3; // Only show Top3 when at least 3 entries
  const top3 = showTop3 ? entries.slice(0, 3) : [];
  const rest = showTop3 ? entries.slice(3) : entries; // If no Top3, show all in normal flow
  const tabDescription =
    activeTab === "game"
      ? initialData.gameTitle ?? "Game Leaderboard"
      : activeTab === "current"
        ? "Real-time standings from the current game"
        : "The greatest of all time";

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto flex flex-col px-3"
    >
      {/* CROWN IMAGE - fades out on scroll, positioned behind header */}
      <div
        className="pt-6 grid place-items-center transition-opacity duration-150 relative z-0"
        style={{
          opacity: crownOpacity,
          pointerEvents: crownOpacity < 0.1 ? "none" : "auto",
          marginBottom: "-60px", // Crown overlaps under header
        }}
      >
        <Image
          src="/images/chest-crown.png"
          alt=""
          width={320}
          height={260}
          priority
          className="h-[180px] w-auto will-change-[opacity]"
          style={{
            transform: `scale(${0.95 + crownOpacity * 0.05})`,
          }}
        />
      </div>

      {/* STICKY HEADER - sits above crown with gradient fade */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="sticky top-0 z-30 -mx-3 px-3 pt-8 pb-6 transition-[background] duration-200"
        style={{
          background: isSticky
            ? "linear-gradient(to bottom, #0A0A0C 0%, #0A0A0C 70%, transparent 100%)"
            : "linear-gradient(to bottom, transparent 0%, #0A0A0C 30%, #0A0A0C 70%, transparent 100%)",
        }}
      >
        <h1 className="text-center font-body text-[36px] tracking-[1px]">
          LEADERBOARD
        </h1>

        <div className="mt-4 flex items-center justify-center gap-6">
          <Tabs activeTab={activeTab as LeaderboardTabKey} fid={userFid} />
        </div>

        <p className="mt-3 text-center text-muted font-display text-sm">
          {tabDescription}
        </p>
      </motion.div>

      {/* LIST SECTION */}
      <section className="pb-24 pt-4 space-y-4">
        {/* Top 3 - only shown when at least 3 entries */}
        <AnimatePresence mode="wait">
          {showTop3 && (
            <motion.div
              key={`top3-${activeTab}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            >
              <Top3 entries={top3} currentUserId={userFid} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rest of list */}
        <motion.div
          key={`list-${activeTab}`}
          layout
          className="space-y-3"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              }
            }
          }}
          initial="hidden"
          animate="visible"
        >
          {rest.map((entry, index) => (
            <motion.div
              key={`${activeTab}-${entry.rank}-${entry.id}`}
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0 }
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Row
                entry={entry}
                isCurrentUser={userFid != null && entry.fid === userFid}
              />
            </motion.div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-4 flex justify-center"
            >
              <WaffleLoader size={60} text="" />
            </motion.div>
          )}

          {/* Error message */}
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="panel px-3 py-3 text-sm text-danger text-center rounded-xl"
            >
              {error}
            </motion.div>
          )}

          {/* Empty state */}
          {isEmpty && !error && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-6 px-4 border border-white/10 rounded-2xl bg-white/5"
            >
              <p className="font-display text-sm text-white/40 text-center">
                No rankings yet
              </p>
            </motion.div>
          )}

          {/* Infinite scroll trigger */}
          {hasMore && !isLoading && !error && (
            <div ref={loaderRef} className="h-10 w-full" />
          )}

          {/* End of list */}
          {!hasMore && !isEmpty && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-3 text-center text-sm text-white/30 font-display"
            >
              — End of leaderboard —
            </motion.div>
          )}
        </motion.div>
      </section>
    </div>
  );
}
