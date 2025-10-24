"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import { WalletIcon } from "@/components/icons";
import { useGetTokenBalance } from "@coinbase/onchainkit/wallet";
import { env } from "@/lib/env";
import { base } from "wagmi/chains";
import LeaveGameDrawer from "./_components/LeaveGameDrawer";

export function GameClientImpl() {
  const router = useRouter();
  const gameView = useGameStore((s) => s.gameView);
  const game = useGameStore((s) => s.game);
  const resetGame = useGameStore((s) => s.resetGame);
  const ticket = useLobbyStore((state) => state.ticket);
  const user = useMiniUser();

  const fetchMessages = useGameStore((state) => state.fetchMessages);
  const fetchTicket = useLobbyStore((state) => state.fetchTicket);
  // Drawer starts closed; opened when user taps "leave"
  const [isLeaveGameDrawerOpen, setIsLeaveGameDrawerOpen] = useState(false);

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

  // Fetch messages if we have a valid game and user
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Redirect if missing invite code or ticket
  useEffect(() => {
    if (!ticket) {
      router.replace("/lobby/buy");
    }
  }, [ticket, router]);

  // Confirm leave: reset local game state and route back to lobby buy page
  const leaveGame = useCallback(() => {
    try {
      resetGame();
    } finally {
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
    <div className="w-full min-h-[100dvh] overflow-hidden bg-figmaYay">
      {/* HEADER */}
      <div
        className={cn(
          "p-4 flex items-center justify-between border-b border-border bg-figmaYay"
        )}
      >
        <LogoIcon />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-figmaYay rounded-full px-3 py-1.5">
            <WalletIcon className="w-4 h-4 text-foreground" />
            <span className="text-xs text-foreground">{`$${roundedBalance}`}</span>
          </div>
          {(gameView === "ROUND_COUNTDOWN" ||
            gameView === "QUESTION_ACTIVE" ||
            gameView === "ANSWER_SUBMITTED") && (
            <button
              onClick={() => setIsLeaveGameDrawerOpen(true)}
              className="text-xs text-[#00CFF2] underline underline-offset-2"
            >
              leave
            </button>
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
