"use client";

import { useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import CountdownView from "./_components/CountdownView";
import QuestionView from "./_components/QuestionView";
import LobbyView from "./_components/LobbyView";
import GameOverView from "./_components/GameOverView";

export default function GameScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const gameId = useGameStore((s) => s.gameId);

  useEffect(() => {
    if (gameId) {
      useGameStore.getState().fetchMessages(gameId);
    }
  }, [gameId]);

  const view = (() => {
    switch (gameState) {
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
    <div className="w-full min-h-[100dvh] overflow-hidden bg-figma">{view}</div>
  );
}
