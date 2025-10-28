"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { Tabs, type LeaderboardTabKey } from "./_components/Tabs";
import { Top3 } from "./_components/Top3";
import { Row } from "./_components/Row";
import { WalletIcon } from "@/components/icons";
import LogoIcon from "@/components/logo/LogoIcon";
import { BottomNav } from "@/components/BottomNav";
import { useInfiniteLoader } from "./_components/useInfiniteLoader";
import { useMiniUser } from "@/hooks/useMiniUser";
import { LeaderboardEntry } from "@/state/types";

export type TabKey = "current" | "allTime";

interface LeaderboardUser {
  id: number;
  rank: number;
  fid: number;
  name: string;
  points: number;
  imageUrl: string | null;
}

// Fetcher function for SWR
// Note: Adapts to useSWRInfinite key format
const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((res) => {
    if (!res.ok) {
      throw new Error("Failed to fetch leaderboard data");
    }
    return res.json();
  });

// Define the expected API response structure
interface LeaderboardApiResponse {
  users: LeaderboardUser[];
  hasMore: boolean;
  me: LeaderboardUser | null;
  totalPlayers?: number;
  totalPoints?: number;
}

export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  const user = useMiniUser();

  const activeTab = (searchParams.get("tab") || "current") as LeaderboardTabKey;

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: LeaderboardApiResponse | null
    ): string | null => {
      if (previousPageData && !previousPageData.hasMore) return null;

      if (pageIndex === 0)
        return `/api/leaderboard?tab=${activeTab}&page=0${
          user.fid ? `&userId=${user.fid}` : ""
        }`;

      return `/api/leaderboard?tab=${activeTab}&page=${pageIndex}${
        user.fid ? `&userId=${user.fid}` : ""
      }`;
    },
    [activeTab, user.fid]
  );

  const {
    data,
    error,
    isLoading: isLoadingInitial,
    isValidating,
    setSize,
    size,
  } = useSWRInfinite<LeaderboardApiResponse>(getKey, fetcher, {
    revalidateFirstPage: true,
    // Tweak revalidation options as needed
    // revalidateOnFocus: true,
    // refreshInterval: activeTab === 'current' ? 15000 : 0, // Auto-refresh current tab
  });

  // --- Data Processing ---
  const entries: LeaderboardEntry[] = useMemo(() => {
    if (!data) return [];
    return data.flatMap((page) =>
      page.users.map((u) => ({
        id: u.id,
        fid: u.fid,
        rank: u.rank,
        username: u.name,
        points: u.points,
        pfpUrl: u.imageUrl,
      }))
    );
  }, [data]);

  const hasMore = data ? data[data.length - 1]?.hasMore ?? false : true;
  const isLoadingMore =
    isLoadingInitial ||
    (size > 0 && data && typeof data[size - 1] === "undefined" && isValidating);
  const isEmpty = !isLoadingInitial && entries.length === 0;
  const currentError = error ? error.message || "Failed to load data" : null;

  // Extract 'me' data from the *first* page's response if available
  const me = useMemo(() => {
    const meData = data?.[0]?.me;
    return meData
      ? {
          id: meData.id,
          rank: meData.rank,
          username: meData.name,
          points: meData.points,
          pfpUrl: meData.imageUrl,
        }
      : null;
  }, [data]);
  const currentUserId = user.fid;

  // --- Infinite Loading Trigger ---
  const [loaderRef] = useInfiniteLoader(
    () => {
      if (!isLoadingMore && hasMore) {
        setSize(size + 1);
      }
    },
    "0px 0px 600px 0px",
    0,
    [isLoadingMore, hasMore]
  );

  // --- Hero Animation ---
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

  // --- Auto-refresh for 'current' tab --- (moved into useSWRInfinite options)
  // useEffect(() => {
  //   if (activeTab !== "current") return;
  //   const interval = setInterval(() => {
  //     mutate(getKey(0, null)); // Revalidate the first page
  //   }, 15000);
  //   return () => clearInterval(interval);
  // }, [activeTab, getKey, mutate]);

  // ───────────────────────── RENDER ─────────────────────────
  return (
    <main className="min-h-[100dvh] bg-figma noise">
      <header className="sticky top-0 z-20 w-full border-b border-white/20 px-4 py-3 bg-figma">
        <div className="mx-auto max-w-screen-sm flex w-full items-center justify-between ">
          <div className="flex min-w-0 flex-row items-center justify-center">
            <LogoIcon />
          </div>
          <div className="flex items-center">
            <div className="flex h-7 min-w-[64px] flex-row items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
              <WalletIcon className="h-4 w-4 text-[color:var(--text-primary)]" />
              <span
                className="font-edit-undo leading-[1.1] text-[color:var(--text-primary)] text-center"
                style={{ fontSize: "clamp(0.95rem, 1.9vw, 1rem)" }}
              >
                $...
              </span>
            </div>
          </div>
        </div>
      </header>
      {/* HERO + TABS */}
      <section className="mx-auto max-w-screen-sm px-4 pt-6 md:pt-10 relative">
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
        <div className="sticky top-[61px] z-10 -mx-4 px-4 pb-2 pt-1 backdrop-blur-sm bg-figma/80">
          <h1 className="text-center font-body text-2xl md:text-3xl tracking-wide">
            LEADERBOARD
          </h1>
          <div className="mt-5 flex items-center justify-center gap-6">
            <Tabs />
          </div>
          <p className="mt-4 text-center text-muted font-display">
            {activeTab === "current"
              ? "Real-time standings from the current game"
              : "The greatest of all time"}
          </p>
        </div>
      </section>
      {/* LIST */}
      <section className="mx-auto max-w-screen-sm px-4 pb-24 pt-4 space-y-4">
        {!isLoadingInitial && entries.length > 0 && (
          <Top3 entries={entries.slice(0, 3)} currentUserId={currentUserId} />
        )}
        {/* Render rest of the list */}
        <div className="space-y-3">
          {entries.slice(3).map((e) => (
            <Row
              key={`${activeTab}-${e.rank}-${e.id}`}
              entry={e}
              isCurrentUser={
                currentUserId != null && String(e.id) === String(currentUserId)
              }
            />
          ))}
          {/* Loading Indicator */}
          {isLoadingMore && (
            <div className="h-12 rounded-xl panel animate-pulse" />
          )}
          {/* Error Message */}
          {currentError && !isValidating && (
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
          {hasMore && !isLoadingMore && !currentError && (
            <div ref={loaderRef} className="h-10 w-full" />
          )}
          {/* End of List Indicator */}
          {!hasMore && !isLoadingInitial && !isEmpty && !currentError && (
            <div className="panel px-4 py-3 text-center text-sm text-muted">
              End of list.
            </div>
          )}
        </div>
      </section>
      <BottomNav />
    </main>
  );
}
