"use client";

import { useProfileStore } from "@/stores/profileStore";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon, WalletIcon } from "@/components/icons";
import LogoIcon from "@/components/logo/LogoIcon";
import { BottomNav } from "@/components/BottomNav";

/* ---------- Header (same style as other profile screens) ---------- */
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
          className="text-center text-[color:var(--text-primary)]"
          style={{
            fontFamily: "Edit Undo BRK",
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

/* ---------- Sub page header ---------- */
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
      className="font-body flex-grow text-center text-white"
      style={{
        fontWeight: 400,
        fontSize: "clamp(0.94rem, 3vw, 0.98rem)", // ~15px target
        lineHeight: ".92",
        letterSpacing: "-0.03em",
      }}
    >
      {title}
    </h1>

    {/* spacer to balance the back button */}
    <div className="h-[34px] w-[34px]" />
  </div>
);

/* ---------- Stat atoms ---------- */
const LargeStat = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex flex-col items-center justify-center gap-2">
    <p
      className="text-muted font-display"
      style={{
        fontWeight: 500,
        fontSize: "clamp(.9rem,2.8vw,1rem)",
        lineHeight: "1.3",
        letterSpacing: "-0.03em",
      }}
    >
      {label}
    </p>
    <p
      className="text-white font-body"
      style={{
        fontSize: "clamp(1.15rem,4vw,1.25rem)", // ~20px target
        lineHeight: "1",
      }}
    >
      {value}
    </p>
  </div>
);

const IconStat = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) => (
  <div className="flex flex-col items-center justify-center gap-1">
    <Image
      src={icon}
      alt={label}
      width={36}
      height={36}
      className="h-9 w-9"
      sizes="(max-width: 420px) 36px, 36px"
      priority
    />
    <p
      className="text-waffle-gray text-center font-display"
      style={{
        fontWeight: 500,
        fontSize: "clamp(.9rem,2.8vw,1rem)",
        lineHeight: "1.3",
        letterSpacing: "-0.03em",
      }}
    >
      {label}
    </p>
    <p
      className="text-white leading-none font-body"
      style={{
        fontSize: "clamp(1.15rem,4vw,1.25rem)", // ~20px target
        lineHeight: "1",
      }}
    >
      {value}
    </p>
  </div>
);

/* ---------- Page ---------- */
export default function AllTimeStatsPage() {
  const { allTimeStats } = useProfileStore();

  return (
    <div
      className={`
        min-h-screen flex flex-col
        bg-figma
        noise
      `}
    >
      <TopBar />
      <SubPageHeader title="ALL-TIME STATS" />

      <main
        className={`
          mx-auto w-full max-w-lg
          px-4
          pb-[calc(env(safe-area-inset-bottom)+84px)]
          flex flex-col
          gap-5 sm:gap-6
          mt-4
        `}
      >
        {/* ---- Block 1: Totals ---- */}
        <section
          className={`
            rounded-2xl border border-white/20
            p-4 sm:p-5
          `}
        >
          <div
            className={`
              grid grid-cols-2
              gap-x-4 gap-y-4 sm:gap-y-6
              justify-items-center
            `}
          >
            <LargeStat label="Total games" value={allTimeStats.totalGames} />
            <LargeStat label="Wins" value={allTimeStats.wins} />
            <LargeStat label="Win rate" value={allTimeStats.winRate} />
            <LargeStat label="Total won" value={allTimeStats.totalWon} />
          </div>
        </section>

        {/* ---- Block 2: Icon stats ---- */}
        <section
          className={`
            rounded-2xl border border-white/20
            p-4 sm:p-5
          `}
        >
          <div
            className={`
              grid grid-cols-2
              gap-x-6 gap-y-6 sm:gap-y-8
              justify-items-center
            `}
          >
            <IconStat
              icon="/images/icons/trophy.svg"
              label="Highest score"
              value={allTimeStats.highestScore}
            />
            <IconStat
              icon="/images/icons/average.svg"
              label="Average score"
              value={allTimeStats.averageScore}
            />
            <IconStat
              icon="/images/icons/streak-flame.svg"
              label="Current streak"
              value={allTimeStats.currentStreak}
            />
            <IconStat
              icon="/images/icons/rank.svg"
              label="Best rank"
              value={allTimeStats.bestRank}
            />
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
