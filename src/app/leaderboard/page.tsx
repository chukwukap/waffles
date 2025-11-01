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
import { LeaderboardEntry } from "@/state/types";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { useAccount } from "wagmi";
import { env } from "@/lib/env";
import { base } from "wagmi/chains";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

// --- MOCK DATA ---
// Easy on/off switch for development
const USE_MOCK_DATA = true; // <-- SET TO false TO DISABLE

// Define your mock users here. They will be combined with real data.
// Omit 'rank' as it will be auto-calculated.
const MOCK_LEADERBOARD_ENTRIES: Omit<LeaderboardEntry, "rank">[] = [
  {
    id: "mock-1",
    fid: 999001,
    username: "dev_user_one",
    points: 1500.5,
    pfpUrl: "/images/avatars/a.png",
  },
  {
    id: "mock-2",
    fid: 999002,
    username: "dev_user_two",
    points: 950.22,
    pfpUrl: "/images/avatars/b.png",
  },
  {
    id: "mock-3",
    fid: 999003,
    username: "dev_user_three",
    points: 50.1,
    pfpUrl: "/images/avatars/c.png",
  },
  // This entry will overwrite the real user 755074 if they exist
  // To test the "isCurrentUser" highlighting
  {
    id: "mock-755074",
    fid: 755074,
    username: "chukwukauba (MOCK)",
    points: 1234.56,
    pfpUrl: "/images/avatars/d.png",
  },
];
// --- END MOCK DATA ---

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
  totalPlayers?: number;
  totalPoints?: number;
}

export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const account = useAccount();

  const { roundedBalance, status } = useGetTokenBalance(
    account.address as `0x${string}`,
    {
      address: env.nextPublicUsdcAddress as `0x${string}`,
      chainId: base.id,
      decimals: 6,
      image: "/images/tokens/usdc.png",
      name: "USDC",
      symbol: "USDC",
    }
  );

  const activeTab = (searchParams.get("tab") || "current") as LeaderboardTabKey;

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: LeaderboardApiResponse | null
    ): string | null => {
      // If we're using mock data, just load the first page
      if (USE_MOCK_DATA && pageIndex > 0) return null;

      if (previousPageData && !previousPageData.hasMore) return null;

      if (pageIndex === 0)
        return `/api/leaderboard?tab=${activeTab}&page=0${
          fid ? `&userId=${fid}` : ""
        }`;

      return `/api/leaderboard?tab=${activeTab}&page=${pageIndex}${
        fid ? `&userId=${fid}` : ""
      }`;
    },
    [activeTab, fid]
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
  });

  // --- Data Processing ---
  const entries: LeaderboardEntry[] = useMemo(() => {
    // 1. Get real entries from SWR
    const realEntries =
      data?.flatMap((page) =>
        page.users.map((u) => ({
          id: u.id,
          fid: u.fid,
          rank: u.rank,
          username: u.name,
          points: u.points,
          pfpUrl: u.imageUrl,
        }))
      ) ?? [];

    // 2. Check if we should add mock data
    if (USE_MOCK_DATA) {
      // Combine real and mock data using a Map to de-duplicate by FID
      // Mock data will overwrite real data if FIDs match
      const allUsersMap = new Map<number, Omit<LeaderboardEntry, "rank">>();

      // Add real users first
      for (const entry of realEntries) {
        allUsersMap.set(entry.fid, entry);
      }

      // Add/overwrite with mock users
      for (const mockEntry of MOCK_LEADERBOARD_ENTRIES) {
        allUsersMap.set(mockEntry.fid, mockEntry);
      }

      // 3. Sort by points (descending)
      const combinedSorted = Array.from(allUsersMap.values()).sort(
        (a, b) => b.points - a.points
      );

      // 4. Re-assign ranks
      return combinedSorted.map((user, index) => ({
        ...user,
        rank: index + 1, // Re-calculate rank
      }));
    }

    // 5. If not using mock data, return real entries as-is
    return realEntries;
  }, [data]);

  // Disable infinite scroll if we're using mock data
  const hasMore = USE_MOCK_DATA
    ? false
    : data
    ? data[data.length - 1]?.hasMore ?? false
    : true;

  const isLoadingMore =
    isLoadingInitial ||
    (size > 0 && data && typeof data[size - 1] === "undefined" && isValidating);
  const isEmpty = !isLoadingInitial && entries.length === 0;
  const currentError = error ? error.message || "Failed to load data" : null;

  const currentUserId = fid; // This is the FID

  // --- Infinite Loading Trigger ---
  const [loaderRef] = useInfiniteLoader(
    () => {
      // Don't load more if using mock data
      if (!isLoadingMore && hasMore && !USE_MOCK_DATA) {
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

  // ───────────────────────── RENDER ─────────────────────────
  return (
    <main className="flex-1 overflow-y-auto ">
      <header className="sticky top-0 z-20 w-full border-b border-white/20 px-4 bg-[#191919]">
        <div className="mx-auto max-w-screen-sm flex w-full items-center justify-between ">
          <div className="flex min-w-0 flex-row items-center justify-center">
            <LogoIcon />
          </div>
          <div className="flex items-center">
            <div className="flex h-7 min-w-[64px] flex-row items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
              <WalletIcon className="h-4 w-4 text-foreground" />
              <span
                className="font-edit-undo leading-[1.1] text-foreground text-center"
                style={{ fontSize: "clamp(0.95rem, 1.9vw, 1rem)" }}
              >
                {status === "pending" ? "---" : `$${roundedBalance}`}{" "}
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
        <div className="sticky top-[61px] z-10 -mx-4 px-4 pb-2 pt-1 backdrop-blur-sm">
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
              isCurrentUser={currentUserId != null && e.fid === currentUserId}
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
