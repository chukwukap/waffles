"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

import { LeaderboardData, TabKey } from "./page";
import { Tabs, LeaderboardTabKey } from "./_components/Tabs";
import { Top3 } from "./_components/Top3";
import { Row } from "./_components/Row";
import { WaffleLoader } from "@/components/ui/WaffleLoader";

// ============================================
// TYPES
// ============================================
interface LeaderboardClientProps {
  initialData: LeaderboardData;
  activeTab: TabKey;
  gameId?: number;
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

  // ============================================
  // STATE
  // ============================================
  const [entries, setEntries] = useState(initialData.entries);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [page, setPage] = useState(1); // Page 0 was fetched on server
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // REFS
  // ============================================
  const loaderRef = useRef<HTMLDivElement>(null);
  const crownRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ============================================
  // EFFECTS
  // ============================================

  // Reset state when tab changes
  useEffect(() => {
    setEntries(initialData.entries);
    setHasMore(initialData.hasMore);
    setPage(1);
    setError(null);
  }, [activeTab, initialData]);

  // Hero scroll animation
  useEffect(() => {
    const el = crownRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const progress = 1 - entry.intersectionRatio;
        document.documentElement.style.setProperty(
          "--lb-progress",
          `${Math.min(Math.max(progress, 0), 1)}`
        );
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
      { rootMargin: "600px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  // ============================================
  // HANDLERS
  // ============================================

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ tab: activeTab, page: String(page) });
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
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
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
    <div className="flex-1 overflow-y-auto flex flex-col mx-auto max-w-sm px-4">
      {/* HERO SECTION */}
      <section className="pt-6 md:pt-10 relative">
        {/* Crown Image */}
        <div ref={crownRef} className="relative grid place-items-center">
          <Image
            src="/images/chest-crown.png"
            alt=""
            width={320}
            height={260}
            priority
            className="h-[180px] w-auto md:h-[220px] will-change-transform transition-[opacity,transform] duration-300"
            style={{
              opacity: `calc(1 - var(--lb-progress, 0))`,
              transform: `translateY(calc(-8px * var(--lb-progress, 0))) scale(calc(1 - 0.05 * var(--lb-progress, 0)))`,
            }}
          />
        </div>

        {/* Sticky Header */}
        <div className="sticky top-[61px] z-10 -mx-4 px-4 pb-2 pt-1 backdrop-blur-sm">
          <h1 className="text-center font-body text-2xl md:text-3xl tracking-wide">
            LEADERBOARD
          </h1>

          <div className="mt-5 flex items-center justify-center gap-6">
            <Tabs activeTab={activeTab as LeaderboardTabKey} fid={userFid} />
          </div>

          <p className="mt-4 text-center text-muted font-display">
            {tabDescription}
          </p>
        </div>
      </section>

      {/* LIST SECTION */}
      <section className="pb-24 pt-4 space-y-4">
        {/* Top 3 */}
        {top3.length > 0 && <Top3 entries={top3} currentUserId={userFid} />}

        {/* Rest of list */}
        <div className="space-y-3">
          {rest.map((entry) => (
            <Row
              key={`${activeTab}-${entry.rank}-${entry.id}`}
              entry={entry}
              isCurrentUser={userFid != null && entry.fid === userFid}
            />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="py-4">
              <WaffleLoader size={60} text="" />
            </div>
          )}

          {/* Error message */}
          {error && !isLoading && (
            <div className="panel px-4 py-3 text-sm text-danger">{error}</div>
          )}

          {/* Empty state */}
          {isEmpty && !error && (
            <div className="panel px-4 py-6 text-center text-sm text-muted">
              Nothing here yet.
            </div>
          )}

          {/* Infinite scroll trigger */}
          {hasMore && !isLoading && !error && (
            <div ref={loaderRef} className="h-10 w-full" />
          )}

          {/* End of list */}
          {!hasMore && !isEmpty && !error && (
            <div className="panel px-4 py-3 text-center text-sm text-muted">
              End of list.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
