"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import QuestionView from "./_components/QuestionView";
import WaitingView from "./_components/WaitingView";
import JoinGameView from "./_components/JoinGameView";
import LeaveGameDrawer from "./_components/LeaveGameDrawer";
import LogoIcon from "@/components/logo/LogoIcon";
import { LeaveGameIcon, WalletIcon } from "@/components/icons";

import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { env } from "@/lib/env";
import { base } from "wagmi/chains";
import { cn } from "@/lib/utils";
import SoundManager from "@/lib/SoundManager";

import { leaveGameAction } from "@/actions/game";
import { notify } from "@/components/ui/Toaster";
import { useUserPreferences } from "@/components/providers/userPreference";
import { NeccessaryGameInfo, NeccessaryUserInfo } from "./page";

import { useAccount } from "wagmi";

interface GameClientImplProps {
  game: NeccessaryGameInfo;
  userInfo: NeccessaryUserInfo;
}

export function GameClientImpl({ game, userInfo }: GameClientImplProps) {
  const router = useRouter();
  const { address } = useAccount();
  const { prefs } = useUserPreferences();

  const [isLeaveGameDrawerOpen, setIsLeaveGameDrawerOpen] = useState(false);

  const { roundedBalance } = useGetTokenBalance(address as `0x${string}`, {
    address: env.nextPublicUsdcAddress as `0x${string}`,
    decimals: 6,
    name: "USDC",
    symbol: "USDC",
    image: "/images/tokens/usdc.png",
    chainId: base.id,
  });

  // ───────────────────────── EFFECTS ─────────────────────────
  // Init sound on first interaction
  useEffect(() => {
    if (!prefs.soundEnabled) return;

    const handleInteraction = () => {
      SoundManager.init().catch(() => {
        console.error("Failed to initialize sound");
      });
    };

    window.addEventListener("pointerdown", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [prefs.soundEnabled]);

  // Ensure no leftover sounds leak when leaving game screen
  useEffect(() => {
    return () => {
      SoundManager.stopAll();
    };
  }, []);

  const leaveGame = useCallback(async () => {
    try {
      await leaveGameAction({ fid: userInfo.fid, gameId: game.id });
      setIsLeaveGameDrawerOpen(false);
      router.refresh();
    } catch {
      notify.error("Failed to leave game:");
      setIsLeaveGameDrawerOpen(false);
    }
  }, [userInfo.fid, game.id, router]);

  // ───────────────────────── VIEW LOGIC ─────────────────────────
  const view = (() => {
    // Only minimum local checks here. Main access checks are now server-side.
    if (!game || !userInfo) return null;

    const now = new Date();
    const start = new Date(game.startTime);
    const end = new Date(game.endTime);

    const isParticipant = userInfo._count.gameParticipants > 0;

    const isWaiting = now.getTime() < start.getTime();
    const isActive = now >= start && now <= end;

    if (isWaiting) {
      // Pass startTime to WaitingView. It will handle its own countdown.
      // The onComplete logic (router.refresh()) will be inside WaitingView.
      return (
        <WaitingView
          game={game}
          startTime={game.startTime}
          userInfo={userInfo}
        />
      );
    }

    if (!isParticipant) {
      return <JoinGameView game={game} userInfo={userInfo} friends={[]} />;
    }

    if (isActive) {
      // Pass the fully loaded data to QuestionView
      return <QuestionView game={game} userInfo={userInfo} />;
    }

    // Fallback if game is not active (e.g., time calculations are off)
    // Pass startTime to WaitingView
    return (
      <WaitingView game={game} startTime={game.startTime} userInfo={userInfo} />
    );
  })();

  // ───────────────────────── RENDER ─────────────────────────
  return (
    <div className="w-full min-h-dvh flex-1 overflow-y-auto">
      <header
        className={cn(
          "sticky top-0 z-40 px-4 flex items-center justify-between border-b border-border backdrop-blur-sm"
        )}
      >
        <LogoIcon />
        <div className="flex items-center gap-2">
          {userInfo._count.gameParticipants > 0 ? (
            <button
              onClick={() => setIsLeaveGameDrawerOpen(true)}
              className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-xs text-foreground hover:bg-white/20 transition-colors"
            >
              <LeaveGameIcon className="w-4 h-4" />
              <span>leave game</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5  rounded-full px-3 py-1.5 border border-white/10">
              <WalletIcon className="w-4 h-4 text-foreground" />
              <span className="text-xs text-foreground">
                {`$${roundedBalance}`}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* The 'view' variable will be null while the redirect effect is firing */}
      {view}

      <LeaveGameDrawer
        open={isLeaveGameDrawerOpen}
        onClose={() => setIsLeaveGameDrawerOpen(false)}
        onConfirmLeave={leaveGame}
      />
    </div>
  );
}
