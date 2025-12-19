"use client";

import { useState } from "react";
import { useProfile } from "./ProfileProvider";
import { InviteFriendsIcon, UploadIcon } from "@/components/icons";
import { BottomNav } from "@/components/BottomNav";
import { ProfileCard } from "./_components/ProfileCard";
import { Stats } from "./stats/_components/Stats";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { notify } from "@/components/ui/Toaster";
import InviteFriendsButton from "./_components/InviteFriendsButton";
import { InviteDrawer } from "./_components/InviteFriendsDrawer";
import GameHistory from "./games/_components/GameHistory";
import { cn } from "@/lib/utils";

// ==========================================
// COMPONENT
// ==========================================

export default function ProfilePage() {
  const { user, stats, games, isLoading } = useProfile();
  const [inviteOpen, setInviteOpen] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <WaffleLoader text="LOADING PROFILE..." />
        </div>
        <BottomNav />
      </>
    );
  }

  // Error state
  if (!user) {
    return (
      <>
        <div className="p-4 text-center text-muted">
          User not identified. Cannot load profile.
        </div>
        <BottomNav />
      </>
    );
  }

  const safeUsername = user.username || "Player";
  const safeAvatarUrl = user.pfpUrl || "/images/avatars/a.png";
  const showReferralButton = user.inviteCode !== null;

  // Limit to 2 games for compact view
  const recentGames = games.slice(0, 2).map((g) => ({
    id: g.id,
    onchainId: g.onchainId,
    name: g.title,
    score: g.score,
    claimedAt: g.claimedAt,
    winnings: g.winnings,
    winningsColor: g.winnings > 0 ? ("green" as const) : ("gray" as const),
  }));

  return (
    <>
      {/* Main container - flex column, no scroll */}
      <div
        className="flex-1 flex flex-col overflow-hidden px-3"
        style={{ maxHeight: "calc(100dvh - 72px)" }}
      >
        {/* Header */}
        <header className="flex items-center justify-between shrink-0 py-3">
          <div className="h-8 w-8 shrink-0 opacity-0" aria-hidden="true">
            <UploadIcon className="h-3.5 w-3.5" />
          </div>
          <h1
            className="font-body font-normal tracking-tight text-white leading-[0.92] text-center select-none"
            style={{
              fontSize: "clamp(1.2rem, 4vw, 1.375rem)",
              letterSpacing: "-0.03em",
            }}
          >
            PROFILE
          </h1>
          <button
            onClick={() => setInviteOpen(true)}
            aria-label="Invite Friends"
            className={cn(
              "box-border flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition-all duration-200",
              "hover:bg-white/25 hover:scale-105 active:scale-95",
              !showReferralButton && "opacity-50 cursor-not-allowed"
            )}
            disabled={!showReferralButton}
          >
            <InviteFriendsIcon className="h-[18px] w-[18px]" />
          </button>
        </header>

        {/* Profile Card */}
        <div
          className="shrink-0"
          style={{ height: "clamp(120px, 20vh, 152px)" }}
        >
          <ProfileCard
            username={safeUsername}
            streak={stats?.currentStreak ?? 0}
            avatarUrl={safeAvatarUrl}
            onUpload={() => {
              notify.info("Avatar upload coming soon!");
            }}
          />
        </div>

        {/* Invite Button */}
        <div className="shrink-0 py-2">
          <InviteFriendsButton onInvite={() => setInviteOpen(true)} />
        </div>

        {/* Stats Section */}
        <div className="shrink-0">
          <Stats
            stats={{
              totalGames: stats?.totalGames ?? 0,
              wins: stats?.wins ?? 0,
              winRate: stats?.winRate ?? 0,
              totalWon: stats?.totalWon ?? 0,
              highestScore: stats?.highestScore ?? 0,
              avgScore: stats?.avgScore ?? 0,
              currentStreak: stats?.currentStreak ?? 0,
              bestRank: stats?.bestRank ?? null,
            }}
            fid={user.fid}
          />
        </div>

        {/* Game History */}
        <div className="flex-1 min-h-0 mt-2">
          <GameHistory gameHistory={recentGames} fid={user.fid} />
        </div>
      </div>

      <BottomNav />

      <InviteDrawer isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
