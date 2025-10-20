"use client";

import { useGameStore } from "@/stores/gameStore";
import CountdownView from "./_components/CountdownView";
import QuestionView from "./_components/QuestionView";

import GameInfoBar from "./_components/GameInfoBar";

import LobbyView from "./_components/LobbyView";

export default function GameScreen() {
  const gameState = useGameStore((state) => state.gameState);

  // // Hook for the round countdown
  // useCountdown(tickRoundTimer, 1000, gameState === "ROUND_COUNTDOWN");

  // // Hook for the question countdown
  // useCountdown(tickQuestionTimer, 1000, gameState === "QUESTION_ACTIVE");

  const renderGameView = () => {
    switch (gameState) {
      case "ROUND_COUNTDOWN":
        return <CountdownView />;
      case "QUESTION_ACTIVE":
      case "ANSWER_SUBMITTED":
        return <QuestionView />;
      case "LOBBY":
        return <LobbyView />;
      default:
        // Placeholder for a lobby or initial screen
        return <div>Welcome to the Lobby!</div>;
    }
  };

  return (
    <main className="relative w-full min-h-screen mx-auto   flex flex-col">
      <GameInfoBar />
      <div className="flex-1 flex flex-col justify-center items-center gap-4">
        {renderGameView()}
      </div>
    </main>
  );
}
