"use client";

import React, { useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import CountdownView from "./_components/CountdownView";
import QuestionView from "./_components/QuestionView";
import LobbyView from "./_components/LobbyView";
import GameOverView from "./_components/GameOverView";
import { useMiniUser } from "@/hooks/useMiniUser";
import { useRouter } from "next/navigation";
import { useLobbyStore } from "@/stores/lobbyStore";

export function GameClientImpl() {
  const router = useRouter();
  const gameView = useGameStore((s) => s.gameView);
  const game = useGameStore((s) => s.game);
  const ticket = useLobbyStore((state) => state.ticket);
  const user = useMiniUser();

  const fetchMessages = useGameStore((state) => state.fetchMessages);
  const fetchTicket = useLobbyStore((state) => state.fetchTicket);

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
        return <LobbyView />;
    }
  })();

  return (
    <div className="w-full min-h-[100dvh] overflow-hidden bg-figmaYay">
      {view}
    </div>
  );
}
