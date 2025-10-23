// app/profile/history/page.tsx
"use client";

import Link from "next/link";
import { useProfileStore } from "@/stores/profileStore";
import { BottomNav } from "@/components/BottomNav";
import LogoIcon from "@/components/logo/LogoIcon";
import {
  ArrowLeftIcon,
  WalletIcon,
  WaffleIcon,
  ZapIcon,
} from "@/components/icons";
import type { GameHistory } from "@/stores/profileStore";
/* ---------- Top bar (shared look) ---------- */
const TopBar = () => (
  <header
    className={`
      sticky top-0 z-10 w-full
      border-b border-[color:var(--surface-stroke)]
      bg-[color:var(--brand-ink-900)]
    `}
  >
    <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3">
      <LogoIcon />
      <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
        <WalletIcon className="h-4 w-4 text-[color:var(--text-primary)]" />
        <span
          className="text-center text-[color:var(--text-primary)] font-display"
          style={{
            fontSize: "clamp(.95rem,1.9vw,1rem)",
            lineHeight: "1.1",
          }}
        >
          $983.23
        </span>
      </div>
    </div>
  </header>
);

/* ---------- Sub-page header ---------- */
const SubPageHeader = ({ title }: { title: string }) => (
  <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 pt-4">
    <Link
      href="/profile"
      className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/15 transition-opacity hover:opacity-80"
      aria-label="Back"
    >
      <ArrowLeftIcon />
    </Link>

    <h1
      className="flex-grow text-center text-white font-body"
      style={{
        fontWeight: 400,
        fontSize: "clamp(1.25rem,4.5vw,1.375rem)", // ~22px target
        lineHeight: ".92",
        letterSpacing: "-0.03em",
      }}
    >
      {title}
    </h1>

    {/* spacer to balance back button */}
    <div className="h-[34px] w-[34px]" />
  </div>
);

/* ---------- List item ---------- */

const GameHistoryItem = ({ game }: { game: GameHistory }) => (
  <div
    className={`
      flex items-center justify-between
      rounded-2xl border border-white/20 bg-transparent
      p-3 sm:p-4
    `}
  >
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10">
        <WaffleIcon aria-hidden />
      </div>

      <div className="min-w-0">
        <p
          className="truncate text-white font-body"
          style={{
            fontSize: "clamp(1.125rem, 2.2vw, 1.25rem)", // ~18–20
            lineHeight: "1",
            letterSpacing: "-0.03em",
          }}
        >
          {game.name}
        </p>

        <div className="mt-1 flex items-center gap-1">
          <span className="text-waffle-yellow" aria-hidden>
            <ZapIcon />
          </span>
          <span
            className="tracking-[-0.03em] text-white/90 font-display"
            style={{
              fontWeight: 500,
              fontSize: "clamp(.75rem,1.2vw,.875rem)", // ~12–14
              lineHeight: "1rem",
            }}
          >
            {game.score}
          </span>
        </div>
      </div>
    </div>

    <p
      className={`ml-3 whitespace-nowrap tracking-[-0.03em] font-display ${
        game.winningsColor === "green" ? "text-success" : "text-muted"
      }`}
      style={{
        fontWeight: 500,
        fontSize: "clamp(1rem,1.8vw,1rem)", // ~16
        lineHeight: "1.2rem",
      }}
    >
      ${game.winnings.toFixed(2)}
    </p>
  </div>
);

/* ---------- Page ---------- */
export default function GameHistoryPage() {
  const { gameHistory } = useProfileStore();

  return (
    <div
      className={`
        min-h-screen flex flex-col
        bg-[linear-gradient(180deg,#1E1E1E_0%,#000_100%)]
        text-[color:var(--text-primary)]
      `}
    >
      <TopBar />
      <SubPageHeader title="GAME HISTORY" />

      <main
        className={`
          mx-auto w-full max-w-lg
          px-4
          pb-[calc(env(safe-area-inset-bottom)+84px)]
          mt-4
        `}
      >
        {/* List */}
        <ul className="flex flex-col gap-3.5 sm:gap-4">
          {gameHistory.map((g) => (
            <li key={g.id}>
              <GameHistoryItem game={g} />
            </li>
          ))}
        </ul>
      </main>

      <BottomNav />
    </div>
  );
}
