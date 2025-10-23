"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { Tabs } from "./_components/Tabs";
import { useLeaderboardStore, Entry } from "@/stores/leaderboardStore";
import { Top3 } from "./_components/Top3";
import { Row } from "./_components/Row";
import { WalletIcon } from "@/components/icons";
import LogoIcon from "@/components/logo/LogoIcon";
import { BottomNav } from "@/components/BottomNav";

export default function LeaderboardPage() {
  const { activeTab, slices, setActiveTab, fetchLeaderboard, rememberScroll } =
    useLeaderboardStore();

  const slice = slices[activeTab];

  // ───────────────────────── DATA PREP ─────────────────────────
  const top3 = useMemo<Entry[]>(
    () => slice.entries.slice(0, 3),
    [slice.entries]
  );
  const rest = useMemo<Entry[]>(() => slice.entries.slice(3), [slice.entries]);

  // ───────────────────────── HERO ANIMATION ─────────────────────────
  const crownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = crownRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const ratio = 1 - e.intersectionRatio;
        document.documentElement.style.setProperty(
          "--lb-progress",
          `${Math.min(Math.max(ratio, 0), 1)}`
        );
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ───────────────────────── SCROLL PERSISTENCE ─────────────────────────
  useEffect(() => setActiveTab(activeTab), [activeTab, setActiveTab]);

  useEffect(() => {
    const onScroll = () => rememberScroll(activeTab, window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [activeTab, rememberScroll]);

  useEffect(() => {
    requestAnimationFrame(() =>
      window.scrollTo({
        top: slices[activeTab].scrollTop ?? 0,
        behavior: "instant" as const,
      })
    );
  }, [activeTab, slices]);

  // ───────────────────────── FETCHING ─────────────────────────
  useEffect(() => {
    const s = slices[activeTab];
    if (!s.entries.length && !s.isLoading) {
      fetchLeaderboard(activeTab).catch(console.error);
    }
  }, [activeTab, slices, fetchLeaderboard]);

  const loadMore = () => {
    const s = slices[activeTab];
    if (!s.isLoading && s.hasMore) {
      fetchLeaderboard(activeTab).catch(console.error);
    }
  };

  // ───────────────────────── OPTIONAL AUTO-REFRESH ─────────────────────────
  // 💡 Toggle ON/OFF easily by commenting this block ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
  useEffect(() => {
    if (activeTab !== "current") return; // refresh only for current game
    const interval = setInterval(() => {
      fetchLeaderboard("current").catch(console.error);
    }, 15000); // every 15 seconds
    return () => clearInterval(interval);
  }, [activeTab, fetchLeaderboard]);
  // 💡 End of auto-refresh block ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

  // ───────────────────────── RENDER ─────────────────────────
  return (
    <main className="min-h-[100dvh] bg-transparent">
      {/* HEADER */}
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
                $983.23
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

        <div className="sticky top-14 z-10 -mx-4 px-4 pb-2 pt-1 bg-transparent">
          <h1 className="text-center font-body text-2xl md:text-3xl tracking-wide">
            LEADERBOARD
          </h1>

          <div className="mt-5 flex items-center justify-center gap-6">
            <Tabs active={activeTab} onChange={setActiveTab} />
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
        <Top3 entries={top3} />

        <div className="space-y-3">
          {rest.map((e) => (
            <Row key={e.rank} entry={e} />
          ))}

          {slice.isLoading && (
            <div className="h-11 rounded-2xl panel animate-pulse" />
          )}
          {slice.error && (
            <div className="panel px-4 py-3 text-sm text-danger">
              {slice.error}
            </div>
          )}
          {!slice.isLoading && !slice.entries.length && !slice.error && (
            <div className="panel px-4 py-6 text-center text-sm text-muted">
              Nothing here yet.
            </div>
          )}

          <button
            onFocus={loadMore}
            onMouseEnter={loadMore}
            onClick={loadMore}
            disabled={slice.isLoading}
            className="mx-auto block h-10 w-full max-w-[220px] rounded-xl border border-white/10 bg-white/5 text-sm transition disabled:opacity-50"
          >
            {slice.hasMore
              ? slice.isLoading
                ? "Loading…"
                : "Load more"
              : "End"}
          </button>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
