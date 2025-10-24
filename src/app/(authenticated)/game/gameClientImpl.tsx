"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CountdownView from "./_components/CountdownView";
import QuestionView from "./_components/QuestionView";
import WaitingView from "./_components/WaitingView";
import GameOverView from "./_components/GameOverView";
import { useMiniUser } from "@/hooks/useMiniUser";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import LogoIcon from "@/components/logo/LogoIcon";
import { LeaveGameIcon, WalletIcon } from "@/components/icons";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { env } from "@/lib/env";
import { baseSepolia } from "wagmi/chains";
import LeaveGameDrawer from "./_components/LeaveGameDrawer";
import SoundManager from "@/lib/SoundManager";
import { useGame, useLobby, type GameView } from "@/state";

export function GameClientImpl() {
  const router = useRouter();
  const {
    game,
    view: gameView,
    resetGame,
    fetchMessages,
    setMessages,
  } = useGame();
  const { ticket, fetchTicket } = useLobby();
  const user = useMiniUser();

  // Drawer starts closed; opened when user taps "leave"
  const [isLeaveGameDrawerOpen, setIsLeaveGameDrawerOpen] = useState(false);
  const soundEnabled = game?.config?.soundEnabled ?? true;
  const previousViewRef = useRef<GameView | null>(null);

  const { roundedBalance } = useGetTokenBalance(user.wallet as `0x${string}`, {
    address: env.nextPublicUsdcAddress as `0x${string}`,
    chainId: baseSepolia.id,
    decimals: 6,
    image: "/images/tokens/usdc.png",
    name: "USDC",
    symbol: "USDC",
  });

  useEffect(() => {
    if (game?.id && user.fid) {
      fetchTicket(user.fid.toString(), game.id);
    }
  }, [fetchTicket, user.fid, game?.id]);

  // Unlock Web Audio API after the first user interaction
  useEffect(() => {
    if (!soundEnabled) return;

    const handleFirstInteraction = () => {
      SoundManager.init().catch((error) => {
        console.debug("Sound manager init failed", error);
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

  // Fetch messages if we have a valid game and user
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Lightweight SWR-like polling using fetch + state setter
  const chatKey = useMemo(
    () => (game?.id ? `/api/chat?gameId=${game.id}` : null),
    [game?.id]
  );
  useEffect(() => {
    if (!chatKey) return;
    let disposed = false;
    const fetcher = async () => {
      try {
        const res = await fetch(chatKey, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!disposed) setMessages(data);
      } catch {}
    };
    fetcher();
    const id = setInterval(fetcher, 3000);
    return () => {
      disposed = true;
      clearInterval(id);
    };
  }, [chatKey, setMessages]);

  // Redirect if missing invite code or ticket
  useEffect(() => {
    if (!ticket) {
      router.replace("/lobby/buy");
    }
  }, [ticket, router]);

  // Handle ambience / countdown sounds as the view changes
  useEffect(() => {
    if (!soundEnabled) {
      SoundManager.stop("countdown");
      previousViewRef.current = gameView;
      return;
    }

    if (gameView === "ROUND_COUNTDOWN") {
      SoundManager.play("countdown", { loop: true });
    } else {
      SoundManager.stop("countdown");
    }

    if (
      gameView === "QUESTION_ACTIVE" &&
      previousViewRef.current !== "QUESTION_ACTIVE"
    ) {
      SoundManager.play("questionStart");
    }

    previousViewRef.current = gameView;
  }, [gameView, soundEnabled]);

  useEffect(() => {
    if (!soundEnabled) {
      SoundManager.stopAll();
    }
  }, [soundEnabled]);

  useEffect(() => {
    return () => {
      SoundManager.stopAll();
    };
  }, []);

  // Confirm leave: reset local game state and route back to lobby buy page
  const leaveGame = useCallback(() => {
    try {
      resetGame();
    } finally {
      setIsLeaveGameDrawerOpen(false);
      router.replace("/game");
    }
  }, [resetGame, router]);

  const view = (() => {
    switch (gameView) {
      case "ROUND_COUNTDOWN":
        return <CountdownView />;
      case "QUESTION_ACTIVE":
      case "ANSWER_SUBMITTED":
        return <QuestionView />;
      case "GAME_OVER":
        return <GameOverView />;
      case "LOBBY":
      default:
        return <WaitingView />;
    }
  })();

  return (
    <div className="w-full min-h-[100dvh] overflow-hidden bg-figma">
      {/* HEADER */}
      <div
        className={cn(
          "p-4 flex items-center justify-between border-b border-border bg-figma"
        )}
      >
        <LogoIcon />
        <div className="flex items-center gap-2">
          {gameView === "ROUND_COUNTDOWN" ||
          gameView === "QUESTION_ACTIVE" ||
          gameView === "ANSWER_SUBMITTED" ? (
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 ">
              <LeaveGameIcon className="w-4 h-4 text-foreground" />

              <button
                onClick={() => setIsLeaveGameDrawerOpen(true)}
                className="text-xs font-body"
              >
                <span className="text-xs text-foreground">leave game</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-figma rounded-full px-3 py-1.5">
              <WalletIcon className="w-4 h-4 text-foreground" />
              <span className="text-xs text-foreground">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(Number(roundedBalance || 0))}
              </span>
            </div>
          )}
        </div>
      </div>

      {view}

      <LeaveGameDrawer
        open={isLeaveGameDrawerOpen}
        onClose={() => setIsLeaveGameDrawerOpen(false)}
        onConfirmLeave={leaveGame}
      />
    </div>
  );
}
