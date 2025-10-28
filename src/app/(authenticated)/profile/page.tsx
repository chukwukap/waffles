"use client";

import {
  ArrowRightIcon,
  InviteFriendsIcon,
  UploadIcon,
  WalletIcon,
} from "@/components/icons";
import { useAppStore } from "@/state/store";
import { GameHistoryEntry } from "@/state/types";
import { GameHistory } from "./_components/GameHistory";
import LogoIcon from "@/components/logo/LogoIcon";
import { BottomNav } from "@/components/BottomNav";
import { ProfileCard } from "./_components/ProfileCard";
import { Stats } from "./_components/Stats";
import { InviteFriendsDrawer } from "./_components/InviteFriendsDrawer";
import { useEffect, useState } from "react";
import { useMiniUser } from "@/hooks/useMiniUser";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { env } from "@/lib/env";
import { base } from "wagmi/chains";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { notify } from "@/components/ui/Toaster";

const fetcherWithFid = (url: string, fid: string | null) => {
  if (!fid) return Promise.reject(new Error("FID required for fetch"));
  return fetch(url, {
    headers: { "x-farcaster-id": fid },
    cache: "no-store",
  }).then(async (res) => {
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const error = new Error(
        `API Error (${res.status}): ${errorBody?.error || res.statusText}`
      );
      (error as Error & { status?: number }).status = res.status;
      throw error;
    }
    return res.json();
  });
};

interface ProfileData {
  fid: number | null;
  name: string | null;
  wallet: string | null;
  imageUrl: string | null;
}
interface ProfileStatsData {
  totalGames: number;
  wins: number;
  winRate: number;
  totalWon: number;
  highestScore: number;
  avgScore: number;
  currentStreak: number;
  bestRank: number | string;
}
interface ReferralStatusData {
  hasInvite: boolean;
  referral?: {
    code: string;
    inviterFarcasterId?: string;
    inviteeId?: number;
    acceptedAt?: string | null;
  };
}

export default function ProfilePage() {
  const { fid } = useMiniUser();
  const fidString = fid ? String(fid) : null;

  const [inviteOpen, setInviteOpen] = useState(false);

  const {
    username,
    streak,
    stats,
    gameHistory,
    myReferral,
    hasLoadedProfile,
    setProfileData,
  } = useAppStore((state) => ({
    username: state.username,
    streak: state.streak,
    stats: state.profileSummaryStats,
    gameHistory: state.gameHistory,
    myReferral: state.myReferral,
    hasLoadedProfile: state.hasLoadedProfile, // Flag to check if profile was ever loaded
    setProfileData: state.setProfileData, // Assume combined action exists
  }));

  // --- Wallet Balance ---
  const userWallet = useMiniUser().wallet; // Get wallet address
  const { status, roundedBalance } = useGetTokenBalance(
    userWallet as `0x${string}`,
    {
      address: env.nextPublicUsdcAddress as `0x${string}`,
      chainId: base.id,
      decimals: 6,
      image: "/images/tokens/usdc.png",
      name: "USDC",
      symbol: "USDC",
    }
  );

  // --- SWR Data Fetching ---
  // Fetch basic profile info
  const {
    data: profileData,
    error: profileError,
    isLoading: isLoadingProfile,
  } = useSWR<ProfileData>(fidString ? "/api/profile" : null, (url: string) =>
    fetcherWithFid(url, fidString)
  );
  // Fetch profile stats
  const {
    data: profileStatsData,
    error: statsError,
    isLoading: isLoadingStats,
  } = useSWR<ProfileStatsData>(
    fidString ? "/api/profile/stats" : null,
    (url: string) => fetcherWithFid(url, fidString)
  );
  // Fetch game history
  const {
    data: profileHistoryData,
    error: historyError,
    isLoading: isLoadingHistory,
  } = useSWR<GameHistoryEntry[]>(
    fidString ? "/api/profile/history" : null,
    (url: string) => fetcherWithFid(url, fidString)
  );
  const {
    data: referralStatusData,
    error: referralError,
    isLoading: isLoadingReferral,
  } = useSWR<ReferralStatusData>(
    fidString ? `/api/referral/status?fid=${fidString}` : null,
    (url: string) => fetcherWithFid(url, fidString)
  );

  const isLoading =
    (isLoadingProfile ||
      isLoadingStats ||
      isLoadingHistory ||
      isLoadingReferral) &&
    !hasLoadedProfile;

  useEffect(() => {
    if (
      profileData &&
      profileStatsData &&
      profileHistoryData &&
      referralStatusData &&
      !isLoading
    ) {
      console.log("Syncing profile data to Zustand store...");
      setProfileData({
        fid: profileData.fid,
        username: profileData.name,
        wallet: profileData.wallet,
        imageUrl: profileData.imageUrl,
        streak: profileStatsData.currentStreak,
        profileSummaryStats: {
          games: profileStatsData.totalGames,
          wins: profileStatsData.wins,
          winnings: profileStatsData.totalWon,
        },
        allTimeStats: {
          totalGames: profileStatsData.totalGames,
          wins: profileStatsData.wins,
          winRate: `${Math.round(profileStatsData.winRate * 10) / 10}%`,
          totalWon: `$${profileStatsData.totalWon.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          highestScore: profileStatsData.highestScore,
          averageScore: Math.round(profileStatsData.avgScore * 100) / 100,
          currentStreak: profileStatsData.currentStreak,
          bestRank:
            profileStatsData.bestRank === Infinity
              ? "-"
              : profileStatsData.bestRank,
        },
        gameHistory: profileHistoryData,
        myReferral: referralStatusData.referral ?? null,
        profileLoading: false,
        hasLoadedProfile: true,
        profileError: null,
      });
    }
  }, [
    profileData,
    profileStatsData,
    profileHistoryData,
    referralStatusData,
    setProfileData,
    isLoading,
  ]);

  useEffect(() => {
    const errors = [
      profileError,
      statsError,
      historyError,
      referralError,
    ].filter(Boolean);
    if (errors.length > 0 && !isLoading) {
      console.error("Profile fetch errors:", errors);
      setProfileData({
        profileLoading: false,
        hasLoadedProfile: false,
        profileError: "Failed to load some profile data.",
      });
    }
  }, [
    profileError,
    statsError,
    historyError,
    referralError,
    isLoading,
    setProfileData,
  ]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!fidString) {
    return (
      <div className="p-4 text-center text-muted">
        User not identified. Cannot load profile.
      </div>
    );
  }

  const inviteCode = myReferral?.code ?? "------";

  return (
    <div className="min-h-screen flex flex-col bg-figma noise ">
      <header className="sticky top-0 z-10 w-full border-b border-white/20 px-4 py-3 bg-figma/80 backdrop-blur-sm">
        <div className="mx-auto max-w-screen-sm flex w-full items-center justify-between">
          <div className="flex min-w-0 flex-row items-center justify-center">
            <LogoIcon />
          </div>
          <div className="flex items-center">
            <div className="flex h-7 min-w-[64px] flex-row items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 border border-white/10">
              <WalletIcon className="h-4 w-4 text-[color:var(--text-primary)]" />
              <span
                className="font-edit-undo leading-[1.1] text-[color:var(--text-primary)] text-center tabular-nums"
                style={{ fontSize: "clamp(0.9rem, 1.8vw, .95rem)" }}
              >
                {status === "pending" ? "Loading..." : `$${roundedBalance}`}{" "}
              </span>
            </div>
          </div>
        </div>
      </header>
      <main
        className={cn(
          "mx-auto w-full max-w-screen-sm px-4",
          "pb-[calc(env(safe-area-inset-bottom)+84px)]",
          "flex flex-col gap-6 sm:gap-8 pt-4 flex-1"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="h-7 w-7 shrink-0 opacity-0" aria-hidden="true">
            <UploadIcon className="h-3.5 w-3.5" />
          </div>
          <h1
            className="font-edit-undo font-normal tracking-tight text-white leading-[0.92] text-center select-none" // Title styles
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
            className="box-border flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/15 p-2 transition-opacity hover:opacity-80"
            disabled={isLoadingReferral || !referralStatusData}
          >
            <InviteFriendsIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        <ProfileCard
          username={username || "Player"}
          streak={streak ?? 0}
          avatarUrl={profileData?.imageUrl || "/images/avatars/a.png"}
          onUpload={() => {
            notify.info("Avatar upload coming soon!");
          }}
        />

        <button
          onClick={() => setInviteOpen(true)}
          disabled={isLoadingReferral || !referralStatusData}
          className={cn(
            "flex flex-row items-center justify-between w-full max-w-screen-sm min-h-[64px] h-[74px] mx-auto px-3 sm:px-4 box-border gap-3 rounded-[16px] border border-white/40 transition-transform hover:scale-[1.02]",
            "bg-[#FFC931] bg-blend-overlay",
            "[background:linear-gradient(189.66deg,rgba(0,0,0,0)_-6.71%,rgba(0,0,0,0.8)_92.73%),_#FFC931]",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          )}
          aria-haspopup="dialog"
          aria-controls="invite-friends-drawer"
        >
          <span
            className="font-normal text-[clamp(1.08rem,2.7vw,1.31rem)] leading-[1.3] text-foreground tracking-tight select-none px-2" // Text style
            style={{ letterSpacing: "-0.03em", fontWeight: 400 }}
          >
            INVITE FRIENDS
          </span>
          <div className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-white/15 flex-shrink-0 p-0.5 ml-2">
            <ArrowRightIcon className="w-[18px] h-[18px]" />
          </div>
        </button>

        <div className="mt-2">
          <Stats stats={stats} />
        </div>

        <div className="mt-4">
          <GameHistory gameHistory={gameHistory} />
        </div>
      </main>
      <BottomNav />
      <InviteFriendsDrawer
        open={inviteOpen}
        code={inviteCode}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  );
}
