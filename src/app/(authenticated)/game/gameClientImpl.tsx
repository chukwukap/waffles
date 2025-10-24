"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useGameStore } from "@/stores/gameStore";
import CountdownView from "./_components/CountdownView";
import QuestionView from "./_components/QuestionView";
import WaitingView from "./_components/WaitingView";
import GameOverView from "./_components/GameOverView";
import { useMiniUser } from "@/hooks/useMiniUser";
import { useRouter } from "next/navigation";
import { useLobbyStore } from "@/stores/lobbyStore";
import { cn } from "@/lib/utils";
import LogoIcon from "@/components/logo/LogoIcon";
import { LeaveGameIcon, WalletIcon } from "@/components/icons";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { env } from "@/lib/env";
import { base } from "wagmi/chains";
import LeaveGameDrawer from "./_components/LeaveGameDrawer";
import SoundManager from "@/lib/SoundManager";
import type { GameView } from "@/stores/gameStore";

export function GameClientImpl() {
  const router = useRouter();
  const gameView = useGameStore((s) => s.gameView);
  const game = useGameStore((s) => s.game);
  const resetGame = useGameStore((s) => s.resetGame);
  const setGameView = useGameStore((s) => s.setGameView);
  const ticket = useLobbyStore((state) => state.ticket);
  const user = useMiniUser();

  const fetchMessages = useGameStore((state) => state.fetchMessages);
  const setMessages = useGameStore((state) => state.setMessages);
  const fetchTicket = useLobbyStore((state) => state.fetchTicket);
  // Drawer starts closed; opened when user taps "leave"
  const [isLeaveGameDrawerOpen, setIsLeaveGameDrawerOpen] = useState(false);
  const soundEnabled = game?.config?.soundEnabled ?? true;
  const previousViewRef = useRef<GameView | null>(null);

  const { roundedBalance } = useGetTokenBalance(user.wallet as `0x${string}`, {
    address: env.nextPublicUsdcAddress as `0x${string}`,
    chainId: base.id,
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

  useEffect(() => {
    if (ticket?.usedAt && gameView !== "GAME_OVER") {
      setGameView("GAME_OVER");
    }
  }, [ticket?.usedAt, gameView, setGameView]);

  // Unlock Web Audio API after the first user interaction
  useEffect(() => {
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
  }, []);

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

  // Stop all sounds when sound is disabled or component unmounts
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
              <span className="text-xs text-foreground">{`$${roundedBalance}`}</span>
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
