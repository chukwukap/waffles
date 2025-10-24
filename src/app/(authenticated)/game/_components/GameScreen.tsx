"use client";

import { useGameStore } from "@/stores/gameStore";
import CountdownView from "./CountdownView";
import QuestionView from "./QuestionView";
import LobbyView from "./WaitingView";

export default function GameScreen() {
  const gameView = useGameStore((s) => s.gameView);

  const view = (() => {
    switch (gameView) {
      case "ROUND_COUNTDOWN":
        return <CountdownView />;
      case "QUESTION_ACTIVE":
      case "ANSWER_SUBMITTED":
        return <QuestionView />;
      case "LOBBY":
        return <LobbyView />;
      default:
        return <LobbyView />;
    }
  })();

  return (
    // Full-bleed container; child views handle their own max-width & padding.
    <div className="w-full min-h-[100dvh] overflow-hidden bg-figmaYay">
      {view}
    </div>
  );
}
