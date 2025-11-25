"use client";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useCallback,
  use,
  useState,
  useTransition,
} from "react";

import { LeaderboardApiResponse } from "./page";
import { LeaderboardTabKey, Tabs } from "./_components/Tabs";
import { fetchMoreLeaderboardData } from "@/actions/leaderboard";
import { useInfiniteLoader } from "./_components/useInfiniteLoader";
import { Top3 } from "./_components/Top3";
import { Row } from "./_components/Row";
import { WaffleLoader } from "@/components/ui/WaffleLoader";

// This is the shape of the data fetched from the server
type InitialData = Promise<LeaderboardApiResponse>;

interface LeaderboardClientPageProps {
  initialDataPromise: InitialData;
  userFid: number | null;
  activeTab: LeaderboardTabKey;
}

export default function LeaderboardClientPage({
  initialDataPromise,
  userFid,
  activeTab,
}: LeaderboardClientPageProps) {
  // 1. Get initial data fetched on the server
  // This will suspend until the promise resolves
  const initialData = use(initialDataPromise);

  // 2. Setup state for client-side data management
  const [entries, setEntries] = useState(initialData.users);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [page, setPage] = useState(1); // We fetched page 0 on server, so next is 1
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 3. Reset state when the active tab changes
  useEffect(() => {
    // The `initialData` will be for the *new* tab because the page
    // re-rendered. We just need to reset our client state.
    setEntries(initialData.users);
    setHasMore(initialData.hasMore);
    setPage(1);
    setCurrentError(null);
    setIsLoadingMore(false);
  }, [activeTab, initialData]);

  // 5. Function to load more entries
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isPending) return;

    setIsLoadingMore(true);
    setCurrentError(null);

    startTransition(async () => {
      try {
        const newData = await fetchMoreLeaderboardData(activeTab, page);
        setEntries((prev) => [...prev, ...newData.users]);
        setHasMore(newData.hasMore);
        setPage((prev) => prev + 1);
      } catch (err) {
        console.error("Failed to load more data:", err);
        setCurrentError("Failed to load more data");
      } finally {
        setIsLoadingMore(false);
      }
    });
  }, [isLoadingMore, hasMore, isPending, activeTab, page]);

  // 6. Infinite Loading Trigger (unchanged logic)
  const [loaderRef] = useInfiniteLoader(loadMore, "0px 0px 600px 0px", 0, [
    isLoadingMore,
    hasMore,
  ]);

  // 7. Hero Animation (unchanged)
  const crownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = crownRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = 1 - entry.intersectionRatio;
        document.documentElement.style.setProperty(
          "--lb-progress",
          `${Math.min(Math.max(ratio, 0), 1)}`
        );
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isLoadingInitial = false; // Data is already loaded via use()
  const isEmpty = !isLoadingInitial && entries.length === 0;

  // ───────────────────────── RENDER ─────────────────────────
  return (
    <div className="flex-1 overflow-y-auto flex flex-col mx-auto max-w-sm px-4">
      {/* HERO + TABS */}
      <section className="pt-6 md:pt-10 relative">
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
        {/* Sticky Header with Title, Tabs, Description */}
        <div className="sticky top-[61px] z-10 -mx-4 px-4 pb-2 pt-1 backdrop-blur-sm">
          <h1 className="text-center font-body text-2xl md:text-3xl tracking-wide">
            LEADERBOARD
          </h1>
          <div className="mt-5 flex items-center justify-center gap-6">
            {/* Pass activeTab and userFid to Tabs component */}
            <Tabs activeTab={activeTab} fid={userFid} />
          </div>
          <p className="mt-4 text-center text-muted font-display">
            {activeTab === "current"
              ? "Real-time standings from the current game"
              : "The greatest of all time"}
          </p>
        </div>
      </section>

      {/* LIST */}
      <section className="pb-24 pt-4 space-y-4">
        {entries.length > 0 && (
          <Top3 entries={entries.slice(0, 3)} currentUserId={userFid} />
        )}

        {/* Render rest of the list */}
        <div className="space-y-3">
          {entries.slice(3).map((e) => (
            <Row
              key={`${activeTab}-${e.rank}-${e.id}`}
              entry={e}
              isCurrentUser={userFid != null && e.fid === userFid}
            />
          ))}

          {/* Loading Indicator */}
          {(isLoadingMore || isPending) && (
            <div className="py-4">
              <WaffleLoader size={60} text="" />
            </div>
          )}

          {/* Error Message */}
          {currentError && !isPending && (
            <div className="panel px-4 py-3 text-sm text-danger">
              {currentError}
            </div>
          )}

          {/* Empty State */}
          {isEmpty && !currentError && (
            <div className="panel px-4 py-6 text-center text-sm text-muted">
              Nothing here yet.
            </div>
          )}

          {/* Infinite Scroll Trigger Element */}
          {hasMore && !isLoadingMore && !currentError && !isPending && (
            <div ref={loaderRef} className="h-10 w-full" />
          )}

          {/* End of List Indicator */}
          {!hasMore && !isEmpty && !currentError && (
            <div className="panel px-4 py-3 text-center text-sm text-muted">
              End of list.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
