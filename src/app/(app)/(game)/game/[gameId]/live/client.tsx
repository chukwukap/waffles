"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

import QuestionCard from "./_components/QuestionCard";
import RoundCountdownCard from "./_components/RoundCountdownCard";
// Import the new payload types from the page
import { LiveGameInfoPayload, LiveGameUserInfoPayload } from "./page";
import { useSound } from "@/components/providers/SoundContext";
import { EXTRA_TIME_SECONDS } from "@/lib/constants";

/**
 * Determines if a round countdown should be shown before the next question.
 * Show countdown if the *next* question has a different roundIndex than the current one.
 * @param currentIdx - The index of the current question
 * @param questions - The full, ordered list of questions
 * @returns boolean
 */
function shouldShowRoundCountdown(
  currentIdx: number,
  questions: LiveGameInfoPayload["questions"]
): boolean {
  if (!questions || questions.length === 0) return false;

  // No next question, so no countdown
  if (currentIdx + 1 >= questions.length) return false;

  const thisRoundIndex = questions[currentIdx]?.roundIndex;
  const nextRoundIndex = questions[currentIdx + 1]?.roundIndex;

  // Show round countdown if this is the last question in a round
  if (
    typeof thisRoundIndex === "number" &&
    typeof nextRoundIndex === "number" &&
    nextRoundIndex > thisRoundIndex
  ) {
    return true;
  }
  return false;
}

export default function LiveGameClient({
  gameInfoPromise,
  userInfoPromise,
  initialQuestionIndex = 0, // New prop for resuming game
}: {
  gameInfoPromise: Promise<LiveGameInfoPayload | null>;
  userInfoPromise: Promise<LiveGameUserInfoPayload | null>;
  initialQuestionIndex?: number;
}) {
  const router = useRouter();
  const gameInfo = React.use(gameInfoPromise);
  const userInfo = React.use(userInfoPromise);
  const { playSound } = useSound();

  // Initialize state with the calculated index from the server
  const [currentQuestionIndex, setCurrentQuestionIndex] =
    React.useState(initialQuestionIndex);
  const [showRoundCountdown, setShowRoundCountdown] = React.useState(false);

  // Get the duration for the *current* question
  const questionTotalTime =
    (gameInfo?.questions[currentQuestionIndex]?.durationSec ?? 10) +
    EXTRA_TIME_SECONDS;

  // Reveals the next question after round countdown completes
  const handleRoundCountdownComplete = React.useCallback(() => {
    setShowRoundCountdown(false);
    playSound("nextQuestion");
    setCurrentQuestionIndex((prev) => prev + 1);
  }, [playSound]);

  // This function decides what to do after a question's time is up
  const handleQuestionCompleted = React.useCallback(() => {
    const nextQuestionIndex = currentQuestionIndex + 1;
    const questions = gameInfo?.questions || [];

    // If we've reached the end of the questions, redirect to the score page
    if (nextQuestionIndex >= questions.length) {
      playSound("gameOver");
      router.push(`/game/${gameInfo?.id}/score?fid=${userInfo?.fid}`);
      return;
    }

    // Decide if round countdown is needed before next question
    if (shouldShowRoundCountdown(currentQuestionIndex, questions)) {
      setShowRoundCountdown(true);
      // Do NOT increment currentQuestionIndex yet; it increments when countdown ends
      return;
    }

    // Otherwise, advance to the next question immediately
    playSound("nextQuestion");
    setCurrentQuestionIndex(nextQuestionIndex);
  }, [
    currentQuestionIndex,
    gameInfo?.questions,
    gameInfo?.id,
    router,
    userInfo?.fid,
    playSound,
  ]);

  // Ensure we have game info and questions before rendering
  if (!gameInfo || !gameInfo.questions || gameInfo.questions.length === 0) {
    // You could return a loading spinner or an error message here
    return (
      <div className="flex-1 flex items-center justify-center text-white/60">
        Loading game questions...
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/60">
        Loading user info...
      </div>
    );
  }

  return (
    <>
      {showRoundCountdown ? (
        <RoundCountdownCard
          duration={gameInfo?.roundDurationSec ?? 15} // Use new field
          onComplete={handleRoundCountdownComplete}
          gameId={gameInfo?.id ?? null}
        />
      ) : (
        <QuestionCard
          question={gameInfo.questions[currentQuestionIndex]}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={gameInfo.questions.length}
          duration={questionTotalTime} // Use the calculated duration
          onComplete={handleQuestionCompleted}
        />
      )}
    </>
  );
}
