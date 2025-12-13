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

interface ProfileData {
  fid: number;
  username: string | null;
  wallet: string | null;
  pfpUrl: string | null;
  waitlistPoints: number;
  rank: number;
  invitesCount: number;
  status: string;
}

export default function ProfilePageClient() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStatsData | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Fetch profile data on mount
  useEffect(() => {
    async function fetchProfileData() {
      try {
        // Fetch user profile
        const userRes = await sdk.quickAuth.fetch("/api/v1/me");
        if (!userRes.ok) {
          if (userRes.status === 401) {
            router.push("/invite");
            return;
          }
          throw new Error("Failed to fetch user");
        }
        const userData: ProfileData = await userRes.json();

        if (userData.status !== "ACTIVE") {
          router.push("/invite");
          return;
        }

        setProfileData(userData);

        // Fetch game history
        const gamesRes = await sdk.quickAuth.fetch("/api/v1/me/games");
        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          // Transform to GameHistoryEntry format
          const history: GameHistoryEntry[] = gamesData.map((g: any) => ({
            id: g.gameId,
            name: g.game?.title ?? "Game",
            score: g.score ?? 0,
            claimedAt: g.claimedAt,
            winnings: g.winnings ?? 0,
            winningsColor: g.winnings > 0 ? "green" : "gray",
          }));
          setGameHistory(history);

          // Calculate stats from game history
          const totalGames = gamesData.length;
          const wins = gamesData.filter((g: any) => g.rank === 1).length;
          const totalScore = gamesData.reduce((sum: number, g: any) => sum + (g.score ?? 0), 0);
          const totalWon = gamesData.reduce((sum: number, g: any) => sum + (g.winnings ?? 0), 0);
          const highestScore = Math.max(...gamesData.map((g: any) => g.score ?? 0), 0);
          const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
          const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
          const bestRank = Math.min(...gamesData.filter((g: any) => g.rank).map((g: any) => g.rank), 999);

          setStats({
            totalGames,
            wins,
            winRate,
            totalWon,
            highestScore,
            avgScore,
            currentStreak: 0, // Would need streak calculation
            bestRank: bestRank < 999 ? bestRank : null,
          });
        }

        // Fetch waitlist data for invite code
        const waitlistRes = await sdk.quickAuth.fetch("/api/v1/waitlist");
        if (waitlistRes.ok) {
          const waitlistData = await waitlistRes.json();
          setInviteCode(waitlistData.inviteCode);
        }
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
  const showReferralButton = inviteCode !== null;

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
            streak={stats?.currentStreak ?? 0}
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
          <GameHistory gameHistory={gameHistory} fid={profileData.fid} />
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
