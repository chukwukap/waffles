"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/miniapp-sdk";
import {
  InviteFriendsIcon,
  UploadIcon,
} from "@/components/icons";
import { GameHistoryEntry, ProfileStatsData } from "@/lib/types";
import GameHistory from "./history/_components/GameHistory";
import { BottomNav } from "@/components/BottomNav";
import { ProfileCard } from "./_components/ProfileCard";
import { Stats } from "./stats/_components/Stats";
import { cn } from "@/lib/utils";
import { notify } from "@/components/ui/Toaster";
import InviteFriendsButton from "./_components/InviteFriendsButton";
import { InviteDrawer } from "./_components/InviteFriendsDrawer";
import { WaffleLoader } from "@/components/ui/WaffleLoader";

interface ProfileResponse {
  fid: number;
  username: string | null;
  pfpUrl: string | null;
  wallet: string | null;
  hasGameAccess: boolean;
  isBanned: boolean;
  inviteCode: string | null;
  waitlistPoints: number;
  rank: number;
  invitesCount: number;
  stats: ProfileStatsData;
  gameHistory: Array<{
    id: number;
    name: string;
    theme: string;
    score: number;
    rank: number | null;
    claimedAt: Date | null;
    winnings: number;
  }>;
}

export default function ProfilePageClient() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Fetch profile data on mount - single API call
  useEffect(() => {
    async function fetchProfileData() {
      try {
        const res = await sdk.quickAuth.fetch("/api/v1/me/profile");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/redeem");
            return;
          }
          throw new Error("Failed to fetch profile");
        }
        const data: ProfileResponse = await res.json();

        setProfileData(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfileData();
  }, [router]);

  const inviteLink = "playwaffles.fun/@cyberverse";

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

  if (!profileData) {
    return (
      <>
        <div className="p-4 text-center text-muted">
          User not identified. Cannot load profile.
        </div>
        <BottomNav />
      </>
    );
  }

  const safeUsername = profileData.username || "Player";
  const safeAvatarUrl = profileData.pfpUrl || "/images/avatars/a.png";
  const showReferralButton = profileData.inviteCode !== null;

  // Transform game history to expected format
  const gameHistory: GameHistoryEntry[] = profileData.gameHistory.map((g) => ({
    id: g.id,
    name: g.name,
    score: g.score,
    claimedAt: g.claimedAt,
    winnings: g.winnings,
    winningsColor: g.winnings > 0 ? "green" : "gray",
  }));

  return (
    <>
      <div className={cn("flex-1 overflow-y-auto space-y-4 px-3")}>
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
              !showReferralButton && "opacity-50 cursor-not-allowed"
            )}
            disabled={!showReferralButton}
          >
            <InviteFriendsIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div>
          <ProfileCard
            username={safeUsername}
            streak={profileData.stats.currentStreak ?? 0}
            avatarUrl={safeAvatarUrl}
            onUpload={() => {
              notify.info("Avatar upload coming soon!");
            }}
          />
        </div>

        <InviteFriendsButton onInvite={() => setInviteOpen(true)} />

        <div className="mt-2">
          <Stats
            stats={{
              totalGames: profileData.stats.totalGames ?? 0,
              wins: profileData.stats.wins ?? 0,
              winRate: profileData.stats.winRate ?? 0,
              totalWon: profileData.stats.totalWon ?? 0,
              highestScore: profileData.stats.highestScore ?? 0,
              avgScore: profileData.stats.avgScore ?? 0,
              currentStreak: profileData.stats.currentStreak ?? 0,
              bestRank: Number(profileData.stats.bestRank ?? null),
            }}
            fid={profileData.fid}
          />
        </div>

        <div className="mt-4">
          <GameHistory gameHistory={gameHistory} fid={profileData.fid} />
        </div>
      </div>
      <BottomNav />
      <InviteDrawer
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </>
  );
}
