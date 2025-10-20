"use client";
import { useProfileStore } from "@/stores/profileStore";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon, WalletIcon } from "@/components/icons";
import LogoIcon from "@/components/logo/LogoIcon";
import { BottomNav } from "@/components/BottomNav";

// Re-using the SubPageHeader from the history page
const SubPageHeader = ({ title }: { title: string }) => (
  <div className="flex items-center justify-between px-4 pt-4">
    <Link
      href="/profile"
      className="w-[34px] h-[34px] rounded-full bg-button-bg flex items-center justify-center transition-opacity hover:opacity-80"
    >
      <ArrowLeftIcon />
    </Link>
    <h1 className="font-edit-undo text-2xl text-center flex-grow -tracking-[0.03em]">
      {title}
    </h1>
    <div className="w-[34px] h-[34px]"></div> {/* Spacer */}
  </div>
);

const LargeStat = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex flex-col items-center justify-center w-[162px] h-[70px]">
    <p className="font-brockmann text-base text-waffle-gray">{label}</p>
    <p className="font-edit-undo text-4xl">{value}</p>
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
  <div className="flex flex-col items-center justify-center w-[156px] h-[99px] gap-1">
    <Image src={icon} alt={label} width={36} height={36} />
    <p className="font-brockmann text-base text-waffle-gray">{label}</p>
    <p className="font-edit-undo text-4xl leading-none">{value}</p>
  </div>
);

export default function AllTimeStatsPage() {
  const { allTimeStats } = useProfileStore();

  return (
    <div className="min-h-screen  flex flex-col">
      <div
        className={
          "p-4 flex items-center justify-between border-b border-border bg-figma"
        }
      >
        <LogoIcon />
        <div className="flex items-center gap-1.5 bg-figma rounded-full px-3 py-1.5">
          <WalletIcon className="w-4 h-4 text-foreground" />
          <span className="text-xs text-foreground">{`$983.23`}</span>
        </div>
      </div>
      <SubPageHeader title="ALL-TIME STATS" />
      <div className="p-4 space-y-3.5 mt-5">
        <div className="p-3 border border-card-border rounded-2xl">
          <div className="grid grid-cols-2 gap-y-3 justify-items-center">
            <LargeStat label="Total games" value={allTimeStats.totalGames} />
            <LargeStat label="Wins" value={allTimeStats.wins} />
            <LargeStat label="Win rate" value={allTimeStats.winRate} />
            <LargeStat label="Total won" value={allTimeStats.totalWon} />
          </div>
        </div>
        <div className="p-3 border border-card-border rounded-2xl">
          <div className="grid grid-cols-2 gap-y-6 justify-items-center">
            <IconStat
              icon="/trophy.png"
              label="Highest score"
              value={allTimeStats.highestScore}
            />
            <IconStat
              icon="/average.png"
              label="Average score"
              value={allTimeStats.averageScore}
            />
            <IconStat
              icon="/streak-flame.png"
              label="Current streak"
              value={allTimeStats.currentStreak}
            />
            <IconStat
              icon="/rank.png"
              label="Best rank"
              value={allTimeStats.bestRank}
            />
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
