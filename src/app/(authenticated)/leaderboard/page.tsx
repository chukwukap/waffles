"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { Tabs } from "./_components/Tabs";
import {
  useLeaderboardStore,
  type LeaderboardUser,
} from "@/stores/leaderboardStore";
import { Top3 } from "./_components/Top3";
import { Row } from "./_components/Row";
import { WalletIcon } from "@/components/icons";
import LogoIcon from "@/components/logo/LogoIcon";
import { BottomNav } from "@/components/BottomNav";

export default function LeaderboardPage() {
  const { activeTab, slices, setActiveTab, fetchPage, rememberScroll } =
    useLeaderboardStore();

  const slice = slices[activeTab];
  const top3 = useMemo<LeaderboardUser[]>(
    () => slice.items.slice(0, 3),
    [slice.items]
  );
  const rest = useMemo<LeaderboardUser[]>(
    () => slice.items.slice(3),
    [slice.items]
  );

  // progress drives only the CROWN fade/scale (0 → 1 as it leaves)
  const crownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = crownRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const r = 1 - e.intersectionRatio;
        document.documentElement.style.setProperty(
          "--lb-progress",
          `${Math.min(Math.max(r, 0), 1)}`
        );
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // lazy + remember/restore scroll
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

  const loadMore = () =>
    !slice.isLoading && slice.hasMore && fetchPage(activeTab);

  return (
    <main className="min-h-[100dvh] bg-transparent">
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
      {/* ───────────────────────── HERO SECTION (single source of truth) ───────────────────────── */}
      <section className="mx-auto max-w-screen-sm px-4 pt-6 md:pt-10 relative">
        {/* crown: scrolls away; only element that fades/scales */}
        <div ref={crownRef} className="relative grid place-items-center  ">
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

        {/* this block docks under the app bar and stays there — it’s the SAME content */}
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

      {/* ───────────────────────── LIST ───────────────────────── */}
      <section className="mx-auto max-w-screen-sm px-4 pb-24 pt-4 space-y-4">
        <Top3 users={top3} />
        <div className="space-y-3">
          {rest.map((u) => (
            <Row key={u.id} user={u} />
          ))}

          {slice.isLoading && (
            <div className="h-11 rounded-2xl panel animate-pulse" />
          )}
          {slice.error && (
            <div className="panel px-4 py-3 text-sm text-danger">
              {slice.error}
            </div>
          )}
          {!slice.isLoading && !slice.items.length && !slice.error && (
            <div className="panel px-4 py-6 text-center text-sm text-muted">
              Nothing here yet.
            </div>
          )}

          <button
            onFocus={loadMore}
            onMouseEnter={loadMore}
            onClick={loadMore}
            className="mx-auto block h-10 w-full max-w-[220px] rounded-xl border border-white/10 bg-white/5 text-sm"
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
