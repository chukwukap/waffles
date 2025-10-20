"use client";
import {
  ArrowRightIcon,
  GamePadIcon,
  InviteFriendsIcon,
  UploadIcon,
  WalletIcon,
  WinningsIcon,
  WinsIcon,
} from "@/components/icons";
import { useProfileStore } from "@/stores/profileStore";
import Image from "next/image";
import Link from "next/link";
import { GameHistoryItem } from "./_components/GameHistoryItem";
import LogoIcon from "@/components/logo/LogoIcon";
import { BottomNav } from "@/components/BottomNav";

export default function ProfilePage() {
  const { username, streak, stats, pastGames } = useProfileStore();

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
      {/* Top Title */}
      <div className="flex items-center justify-between">
        <div className="w-[34px] h-[34px]"></div> {/* Spacer */}
        <h1 className="font-edit-undo text-2xl text-center flex-grow -tracking-[0.03em]">
          PROFILE
        </h1>
        <button className="w-[34px] h-[34px] rounded-full bg-button-bg flex items-center justify-center transition-opacity hover:opacity-80">
          <InviteFriendsIcon />
        </button>
      </div>

      {/* Profile Card */}
      <div className="p-3 border border-card-border rounded-2xl bg-gradient-to-r from-transparent to-yellow-500/10">
        <div className="flex items-center justify-between">
          <button className="w-[34px] h-[34px] rounded-full bg-button-bg flex items-center justify-center transition-opacity hover:opacity-80">
            <UploadIcon />
          </button>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Image
                src="/images/avatars/a.png"
                alt="Avatar"
                width={36}
                height={36}
                className="rounded-full bg-yellow-200"
              />
              <p className="font-edit-undo text-lg">{username}</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-brockmann text-sm">Streak</p>
              <div className="flex items-center gap-2">
                <Image
                  src="/images/icon/streak-flame.png"
                  alt="Streak"
                  width={20}
                  height={36}
                />
                <p className="font-edit-undo text-4xl">{streak}</p>
              </div>
            </div>
          </div>
          <div className="w-[34px] h-[34px]"></div> {/* Spacer */}
        </div>
      </div>

      {/* Invite Friends Button */}
      <button className="w-full h-[74px] bg-invite-button border border-invite-button rounded-2xl flex items-center justify-between px-4 transition-transform hover:scale-[1.02]">
        <span className="font-edit-undo text-xl -tracking-[0.03em]">
          INVITE FRIENDS
        </span>
        <div className="w-[34px] h-[34px] rounded-full bg-white/10 flex items-center justify-center">
          <ArrowRightIcon />
        </div>
      </button>

      {/* Stats Section */}
      <div>
        <div className="flex justify-between items-center mb-3.5">
          <h2 className="font-brockmann text-base text-waffle-gray">Stats</h2>
          <Link
            href="/profile/stats"
            className="font-brockmann text-base text-waffle-yellow hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="flex gap-2">
          <StatCard icon={<GamePadIcon />} label="Games" value={stats.games} />
          <StatCard icon={<WinsIcon />} label="Wins" value={stats.wins} />
          <StatCard
            icon={<WinningsIcon />}
            label="Winnings"
            value={`$${stats.winnings}`}
          />
        </div>
      </div>

      {/* Past Games Section */}
      <div>
        <div className="flex justify-between items-center mb-3.5">
          <h2 className="font-brockmann text-base text-waffle-gray">
            Past games
          </h2>
          <Link
            href="/profile/history"
            className="font-brockmann text-base text-waffle-yellow hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {pastGames.slice(0, 2).map((game) => (
            <GameHistoryItem key={game.id} game={game} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) => (
  <div className="flex-1 flex flex-col gap-3 p-3 bg-card-bg border border-card-border rounded-2xl">
    <p className="font-brockmann text-sm text-waffle-gray">{label}</p>
    <div className="flex items-center gap-1">
      {icon}
      <p className="font-edit-undo text-xl">{value}</p>
    </div>
  </div>
);
