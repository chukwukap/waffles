"use client";

import {
  ArrowRightIcon,
  InviteFriendsIcon,
  UploadIcon,
} from "@/components/icons";
import { GameHistoryEntry, ProfileStatsData } from "@/lib/types"; // Import ProfileStatsData
import GameHistory from "./history/_components/GameHistory";
import { BottomNav } from "@/components/BottomNav";
import { ProfileCard } from "./_components/ProfileCard";
import { Stats } from "./stats/_components/Stats";

import { useState, use } from "react";
import { cn } from "@/lib/utils";
import { notify } from "@/components/ui/Toaster";
import InviteFriendsButton from "./_components/InviteFriendsButton";
import { InviteDrawer } from "./_components/InviteFriendsDrawer";

// Define the payload types, matching the server component
interface ProfileData {
  fid: number;
  username: string | null;
  wallet: string | null;
  pfpUrl: string | null;
}

interface ProfilePagePayload {
  profileData: ProfileData | null;
  stats: ProfileStatsData | null;
  gameHistory: GameHistoryEntry[] | null;
  streak: number;
  username: string | null; // This is duplicative but matches payload
  inviteCode: string | null;
  referralStatusData: number | null;
}

// New prop interface: receives a promise from page.tsx
export default function ProfilePageClient({
  profilePageDataPromise,
}: {
  profilePageDataPromise: Promise<ProfilePagePayload>;
}) {
  // Unwrap the promise using React's use()
  const payload = use(profilePageDataPromise);

  const {
    profileData,
    stats,
    gameHistory,
    streak = 0,
    inviteCode,
    referralStatusData,
  } = payload;

  const inviteLink = "playwaffles.fun/@cyberverse";

  const [inviteOpen, setInviteOpen] = useState(false);

  if (!profileData) {
    return (
      <div className="p-4 text-center text-muted">
        User not identified. Cannot load profile.
      </div>
    );
  }

  // Use the new fields: `username` and `pfpUrl`
  const safeUsername = profileData.username || "Player";
  const safeAvatarUrl = profileData.pfpUrl || "/images/avatars/a.png";

  // Check if the referral button should be shown
  const showReferralButton = referralStatusData !== null;

  return (
    <>
      <div
        className={cn(
          "flex-1 overflow-y-auto  space-y-4 px-3"
        )}
      >
        <div className="flex items-center justify-between mt-4">
          <div className="h-4 w-4 shrink-0 opacity-0" aria-hidden="true">
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
              "box-border flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 p-2 transition-opacity hover:opacity-80",
              !showReferralButton && "opacity-50 cursor-not-allowed" // Disable if no referral data
            )}
            disabled={!showReferralButton}
          >
            <InviteFriendsIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div>
          <ProfileCard
            username={safeUsername}
            streak={streak ?? stats?.currentStreak ?? 0}
            avatarUrl={safeAvatarUrl} // Pass the correct prop
            onUpload={() => {
              notify.info("Avatar upload coming soon!");
            }}
          />
        </div>

        <InviteFriendsButton onInvite={() => setInviteOpen(true)} />

        <div className="mt-2">
          <Stats
            stats={{
              totalGames: stats?.totalGames ?? 0,
              wins: stats?.wins ?? 0,
              winRate: stats?.winRate ?? 0,
              totalWon: stats?.totalWon ?? 0,
              highestScore: stats?.highestScore ?? 0,
              avgScore: stats?.avgScore ?? 0,
              currentStreak: stats?.currentStreak ?? 0,
              bestRank: Number(stats?.bestRank ?? null),
            }}
            fid={profileData.fid}
          />
        </div>

        <div className="mt-4">
          <GameHistory gameHistory={gameHistory ?? []} fid={profileData.fid} />
        </div>
      </div>
      <BottomNav />
      <InviteDrawer
        isOpen={inviteOpen}
        inviteLink={inviteLink}
        onClose={() => setInviteOpen(false)}
      />
    </>
  );
}
