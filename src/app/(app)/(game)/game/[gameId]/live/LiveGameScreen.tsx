"use client";

/**
 * LiveGameScreen
 *
 * Clean phase router that delegates all logic to useLiveGame hook.
 * No hooks after the switch statement - just pure rendering.
 */

import { useLiveGame } from "@/hooks/useLiveGame";
import QuestionView from "./_components/QuestionView";
import BreakView from "./_components/BreakView";
import GameCountdownScreen from "./_components/GameCountdownScreen";
import GameCompleteScreen from "./_components/GameCompleteScreen";
import { CheerOverlay } from "../../_components/CheerOverlay";
import type { LiveGameData } from "./page";

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function LiveGameScreen({ game }: { game: LiveGameData }) {
  const {
    phase,
    secondsRemaining,
    currentQuestion,
    questionNumber,
    totalQuestions,
    hasAnswered,
    isSubmitting,
    score,
    nextRoundNumber,
    startGame,
    submitAnswer,
    onMediaReady,
  } = useLiveGame(game);

  // ==========================================
  // PHASE-BASED RENDERING
  // No hooks below this point!
  // ==========================================

  // return (
  //   <GameCountdownScreen
  //     onComplete={startGame}
  //     recentPlayers={game.recentPlayers}
  //   />
  // );

  switch (phase) {
    case "countdown":
      return (
        <GameCountdownScreen
          onComplete={startGame}
          recentPlayers={game.recentPlayers}
        />
      );

    case "question":
      if (!currentQuestion) {
        // Edge case: no question available
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <p className="font-body text-2xl text-white mb-2">
              NO QUESTIONS LOADED
            </p>
            <p className="font-display text-sm text-white/50">
              The game has no questions or they failed to load.
            </p>
          </div>
        );
      }

      return (
        <>
          <QuestionView
            question={currentQuestion}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            seconds={secondsRemaining}
            onAnswer={submitAnswer}
            hasAnswered={hasAnswered || isSubmitting}
            onMediaReady={onMediaReady}
          />
          <CheerOverlay />
        </>
      );

    case "break":
      return (
        <>
          <div className="flex-1 flex flex-col min-h-0">
            <BreakView
              seconds={secondsRemaining}
              nextRoundNumber={nextRoundNumber}
              gameId={game.id}
            />
          </div>
          <CheerOverlay />
        </>
      );

    case "complete":
      return (
        <GameCompleteScreen
          score={score}
          gameTheme={game.theme}
          gameId={game.id}
          gameNumber={game.gameNumber}
        />
      );
  }
}
