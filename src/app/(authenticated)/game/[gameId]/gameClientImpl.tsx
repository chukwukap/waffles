// ───────────────────────── GameClientImpl.tsx ─────────────────────────
"use client";

import { useCallback, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";

import QuestionView from "./_components/QuestionView";
import WaitingView from "./_components/WaitingView";
import JoinGameView from "./_components/JoinGameView";
import LeaveGameDrawer from "./_components/LeaveGameDrawer";
import LogoIcon from "@/components/logo/LogoIcon";
import { LeaveGameIcon, WalletIcon } from "@/components/icons";

import { useMiniUser } from "@/hooks/useMiniUser";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { env } from "@/lib/env";
import { base } from "wagmi/chains";
import { cn } from "@/lib/utils";
import SoundManager from "@/lib/SoundManager";
import { HydratedGame, HydratedUser } from "@/state/types";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { leaveGameAction } from "@/actions/game";
import { notify } from "@/components/ui/Toaster";
// REMOVED: import { useTimer } from "@/hooks/useTimer";

interface GameClientImplProps {
  game: HydratedGame;
  userInfo: HydratedUser;
}

export function GameClientImpl({ game, userInfo }: GameClientImplProps) {
  const router = useRouter();
  const user = useMiniUser();
  const { prefs } = useUserPreferences();

  const [isLeaveGameDrawerOpen, setIsLeaveGameDrawerOpen] = useState(false);

  const { status, roundedBalance } = useGetTokenBalance(
    user.wallet as `0x${string}`,
    {
      address: env.nextPublicUsdcAddress as `0x${string}`,
      decimals: 6,
      name: "USDC",
      symbol: "USDC",
      image: "/images/tokens/usdc.png",
      chainId: base.id,
    }
  );

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

  // REMOVED: const waitingTimer = useTimer(...)

  // ───────────────────────── VIEW LOGIC ─────────────────────────
  const view = (() => {
    if (!game || !userInfo) return notFound();

    const now = new Date();
    const start = new Date(game.startTime);
    const end = new Date(game.endTime);

    const userTicket = userInfo.tickets?.find((t) => t.gameId === game.id);
    const isParticipant =
      userInfo.gameParticipants?.some((p) => p.gameId === game.id) ?? false;

    // check whether the game is over by checking if the user has answered all the questions
    const isGameOver =
      now > end ||
      (userInfo.answers?.length ?? 0) === (game.questions?.length ?? 0);

    const isWaiting = now.getTime() < start.getTime();
    const isActive = now >= start && now <= end;

    if (isGameOver) {
      router.push(`/game/${game.id}/score`);
      return null;
    }

    if (isWaiting) {
      // Pass startTime to WaitingView. It will handle its own countdown.
      // The onComplete logic (router.refresh()) will be inside WaitingView.
      return <WaitingView game={game} startTime={game.startTime} />;
    }

    if (!userTicket) {
      router.push("/lobby");
      return null;
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
    return <WaitingView game={game} startTime={game.startTime} />;
  })();

  // ───────────────────────── RENDER ─────────────────────────
  return (
    <div className="w-full min-h-[100dvh] flex-1 overflow-y-auto">
      <header
        className={cn(
          "sticky top-0 z-40 p-4 flex items-center justify-between border-b border-border backdrop-blur-sm"
        )}
      >
        <LogoIcon />
        <div className="flex items-center gap-2">
          {userInfo.gameParticipants.length > 0 ? (
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
                {status === "pending" ? "Loading..." : `$${roundedBalance}`}
              </span>
            </div>
          )}
        </div>
      </header>

      {view}

      <LeaveGameDrawer
        open={isLeaveGameDrawerOpen}
        onClose={() => setIsLeaveGameDrawerOpen(false)}
        onConfirmLeave={leaveGame}
      />
    </div>
  );
}
