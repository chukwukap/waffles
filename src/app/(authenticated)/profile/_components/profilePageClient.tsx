"use client";

import {
  ArrowRightIcon,
  InviteFriendsIcon,
  UploadIcon,
  WalletIcon,
} from "@/components/icons";

import { GameHistoryEntry } from "@/state/types";
import { GameHistory } from "./GameHistory";
import LogoIcon from "@/components/logo/LogoIcon";
import { BottomNav } from "@/components/BottomNav";
import { ProfileCard } from "./ProfileCard";
import { Stats } from "./Stats";
import { InviteFriendsDrawer } from "./InviteFriendsDrawer";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { env } from "@/lib/env";
import { base } from "wagmi/chains";
import { notify } from "@/components/ui/Toaster";

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

interface ProfilePageClientProps {
  profileData: ProfileData | null;
  stats: ProfileStatsData | null;
  gameHistory: GameHistoryEntry[] | null;
  streak: number;
  username: string | null;
  inviteCode: string | null;
  referralStatusData: number | null;
}

export default function ProfilePageClient({
  profileData,
  stats,
  gameHistory,
  streak = 0,
  username,
  inviteCode,
  referralStatusData,
}: ProfilePageClientProps) {
  const [inviteOpen, setInviteOpen] = useState(false);

  // --- Wallet Balance ---
  const userWallet = profileData?.wallet;
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

  // Defensive fallback if main data missing (should not occur in production)
  if (!profileData) {
    return (
      <div className="p-4 text-center text-muted">
        User not identified. Cannot load profile.
      </div>
    );
  }

  const showReferralButton =
    referralStatusData !== null && typeof referralStatusData === "number";
  const safeUsername = username || profileData.name || "Player";

  return (
    <div className="flex-1 overflow-y-auto ">
      <header className="sticky top-0 z-10 w-full border-b border-white/20 px-4 app-background/80 backdrop-blur-sm">
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
                {status === "pending" ? "---" : `$${roundedBalance}`}{" "}
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
            className="font-edit-undo font-normal tracking-tight text-white leading-[0.92] text-center select-none"
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
            className="box-border flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 p-2 transition-opacity hover:opacity-80"
            disabled={!showReferralButton}
          >
            <InviteFriendsIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        <ProfileCard
          username={safeUsername}
          streak={streak ?? stats?.currentStreak ?? 0}
          avatarUrl={profileData.imageUrl || "/images/avatars/a.png"}
          onUpload={() => {
            notify.info("Avatar upload coming soon!");
          }}
        />

        <button
          onClick={() => setInviteOpen(true)}
          disabled={!showReferralButton}
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
            className="font-normal text-[clamp(1.08rem,2.7vw,1.31rem)] leading-[1.3] text-foreground tracking-tight select-none px-2"
            style={{ letterSpacing: "-0.03em", fontWeight: 400 }}
          >
            INVITE FRIENDS
          </span>
          <div className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-white/15 flex-shrink-0 p-0.5 ml-2">
            <ArrowRightIcon className="w-[18px] h-[18px]" />
          </div>
        </button>

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
          />
        </div>

        <div className="mt-4">
          <GameHistory gameHistory={gameHistory ?? []} />
        </div>
      </main>
      <BottomNav />
      <InviteFriendsDrawer
        open={inviteOpen}
        code={inviteCode ?? "------"}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  );
}
