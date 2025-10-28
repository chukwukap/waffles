"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import QuestionView from "./_components/QuestionView";
import WaitingView from "./_components/WaitingView";
import JoinGameView from "./_components/JoinGameView";
import LeaveGameDrawer from "./_components/LeaveGameDrawer";
import LogoIcon from "@/components/logo/LogoIcon";
import { LeaveGameIcon, WalletIcon } from "@/components/icons";

// Import Hooks & Utils
import { useMiniUser } from "@/hooks/useMiniUser";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { env } from "@/lib/env";
import { base } from "wagmi/chains";
import { cn } from "@/lib/utils";
import SoundManager from "@/lib/SoundManager";
import type { HydratedGame, HydratedUser } from "@/state/types";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { useTimer } from "@/hooks/useTimer";

interface GameClientImplProps {
  game: HydratedGame;
  userInfo: HydratedUser;
}

/**
 * Main client-side implementation for the game view.
 * Handles state transitions, sound, user interactions, and renders the appropriate view
 * based on the global game state managed by Zustand.
 */
export function GameClientImpl({ game, userInfo }: GameClientImplProps) {
  const router = useRouter();
  const user = useMiniUser();

  const [friends] = useState<
    { fid: number; username: string; pfpUrl: string }[]
  >([
    {
      fid: 1,
      username: "Friend 1",
      pfpUrl: "/images/avatars/a.png",
    },
    {
      fid: 2,
      username: "Friend 2",
      pfpUrl: "/images/avatars/b.png",
    },
    {
      fid: 3,
      username: "Friend 3",
      pfpUrl: "/images/avatars/c.png",
    },
    {
      fid: 4,
      username: "Friend 4",
      pfpUrl: "/images/avatars/d.png",
    },
  ]);

  // --- Local UI State ---
  const [isLeaveGameDrawerOpen, setIsLeaveGameDrawerOpen] = useState(false);

  // --- Wallet Balance ---
  const { status, roundedBalance } = useGetTokenBalance(
    user.wallet as `0x${string}`,
    {
      address: env.nextPublicUsdcAddress as `0x${string}`,
      decimals: 6,
      image: "/images/tokens/usdc.png",
      name: "USDC",
      symbol: "USDC",
      chainId: base.id,
    }
  );

  const soundEnabled = game?.config?.soundEnabled ?? false;

  useEffect(() => {
    if (!soundEnabled) return;

    const handleFirstInteraction = () => {
      SoundManager.init().catch((error) => {
        console.debug(
          "Sound manager init failed (likely user needs to interact first)",
          error
        );
      });
    };

    window.addEventListener("pointerdown", handleFirstInteraction, {
      once: true,
    });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [soundEnabled]);

  useEffect(() => {
    if (!soundEnabled) {
      SoundManager.stop("countdown");
      SoundManager.stopAll();
      return;
    }

    // if (gameState === "GAME_LIVE_ROUND_COUNTDOWN") {
    //   SoundManager.play("countdown", { loop: true });
    // } else {
    //   SoundManager.stop("countdown");
    // }
  }, [soundEnabled]);

  useEffect(() => {
    return () => {
      console.log("GameClientImpl unmounting, stopping all sounds.");
      SoundManager.stopAll();
    };
  }, []);

  const leaveGame = useCallback(() => {
    console.log("Leaving game");
  }, []);

  // Handle case where no game is active after hydration
  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80dvh] text-center px-4">
        <LogoIcon className="w-12 h-12 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          No Active Game
        </h1>
        <p className="text-md text-muted-foreground mb-8">
          There isn&apos;t a game running right now. Check back soon!
          <FancyBorderButton
            onClick={() => router.push("/waitlist")}
            className="mt-4"
          >
            Join the waitlist
          </FancyBorderButton>
        </p>
        <div className="flex items-center gap-1.5 bg-figma rounded-full px-3 py-1.5 border border-white/10">
          <WalletIcon className="w-4 h-4 text-foreground" />
          <span className="text-xs text-foreground">
            {status === "pending" ? "Loading..." : `$${roundedBalance}`}
          </span>
        </div>
      </div>
    );
  }

  // Select the view component based on backend state, not Zustand gameState
  const view = (() => {
    // Basic safety check
    if (!game || !userInfo) return null;

    const now = new Date();
    const start = new Date(game.startTime);
    const end = new Date(game.endTime);

    // Check if user purchased a ticket for this game
    const userTicket = userInfo.tickets?.find((t) => t.gameId === game.id);

    // Has this player actually joined (i.e., is in GameParticipant for this game)?
    const userGameParticipant =
      userInfo.gameParticipants &&
      userInfo.gameParticipants.some((p) => p.gameId === game.id);

    const isGameOver = now > end;
    const isWaiting = now < start;
    const isActive = now >= start && now <= end;

    // If game is over, show GameOverView
    if (isGameOver) {
      router.push(`/game/${game.id}/score`);
      return;
    }

    // If before the scheduled start, show waiting view
    if (isWaiting) {
      return <WaitingView game={game} onComplete={() => {}} />;
    }

    // If user hasn't bought a ticket, show join
    if (!userTicket) {
      router.push("/lobby");
      return;
    }

    // If user hasn't started/participated in the game after ticket purchase
    if (!userGameParticipant) {
      // Could show a "ready" screen (could use JoinGameView or a different ReadyView)
      return <JoinGameView game={game} userInfo={userInfo} friends={friends} />;
    }

    // If game is live and user is participant
    if (isActive && userTicket && userGameParticipant) {
      return <QuestionView game={game} userInfo={userInfo} />;
    }

    // Fallback
    return <WaitingView game={game} onComplete={() => {}} />;
  })();

  return (
    //
    <div className="w-full min-h-[100dvh] overflow-hidden bg-figma">
      <header
        className={cn(
          "sticky top-0 z-40 p-4 flex items-center justify-between border-b border-border bg-figma/80 backdrop-blur-sm"
        )}
      >
        <LogoIcon />
        <div className="flex items-center gap-2">
          {userInfo.gameParticipants.length > 0 ? (
            <button
              onClick={() => setIsLeaveGameDrawerOpen(true)}
              className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-xs text-foreground hover:bg-white/20 transition-colors"
              aria-label="Leave Game"
            >
              <LeaveGameIcon className="w-4 h-4" />
              <span>leave game</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-figma rounded-full px-3 py-1.5 border border-white/10">
              <WalletIcon className="w-4 h-4 text-foreground" />
              <span className="text-xs text-foreground">
                {userInfo.tickets?.length > 0
                  ? "Loading..."
                  : `$${roundedBalance}`}
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
