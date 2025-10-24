"use client";

import { useGame } from "@/state";
import CountdownView from "./CountdownView";
import QuestionView from "./QuestionView";
import LobbyView from "./WaitingView";
import { FinalCountdownView } from "./FinalCountdownView";

export default function GameScreen() {
  const { view: gameView } = useGame();

  const view = (() => {
    if (gameView === "FINAL_COUNTDOWN") {
      return <FinalCountdownView />;
    }
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
    <div className="w-full min-h-[100dvh] overflow-hidden bg-figma">{view}</div>
  );
}
