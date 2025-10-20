"use client";
import { useProfileStore } from "@/stores/profileStore";
import Link from "next/link";
import { GameHistoryItem } from "../_components/GameHistoryItem";
import { ArrowLeftIcon, WalletIcon } from "@/components/icons";
import LogoIcon from "@/components/logo/LogoIcon";
import { BottomNav } from "@/components/BottomNav";

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

export default function GameHistoryPage() {
  const { pastGames } = useProfileStore();

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

      <SubPageHeader title="GAME HISTORY" />
      <div className="p-4 space-y-3.5 mt-5">
        {pastGames.map((game) => (
          <GameHistoryItem key={game.id} game={game} />
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
