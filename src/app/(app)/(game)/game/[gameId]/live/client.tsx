"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/miniapp-sdk";

import { usePartyGame } from "@/hooks/usePartyGame";
import QuestionCard from "./_components/QuestionCard";
import RoundCountdownCard from "./_components/RoundCountdownCard";
import { LiveGameInfoPayload } from "./page";
import { EXTRA_TIME_SECONDS } from "@/lib/constants";
import { WaffleLoader } from "@/components/ui/WaffleLoader";

/**
 * Determines if a round countdown should be shown before the next question.
 */
function shouldShowRoundCountdown(
  currentIdx: number,
  questions: LiveGameInfoPayload["questions"]
): boolean {
  if (!questions || questions.length === 0) return false;
  if (currentIdx + 1 >= questions.length) return false;

  const thisRoundIndex = questions[currentIdx]?.roundIndex;
  const nextRoundIndex = questions[currentIdx + 1]?.roundIndex;

  return (
    typeof thisRoundIndex === "number" &&
    typeof nextRoundIndex === "number" &&
    nextRoundIndex > thisRoundIndex
  );
}

// Auth is handled by GameAuthGate in layout
export default function LiveGameClient({
  gameInfo,
}: {
  gameInfo: LiveGameInfoPayload | null;
}) {
  const router = useRouter();

  const [initialQuestionIndex, setInitialQuestionIndex] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [showRoundCountdown, setShowRoundCountdown] = React.useState(false);

  // Fetch answer progress on mount (auth already verified by layout)
  React.useEffect(() => {
    async function fetchProgress() {
      if (!gameInfo) return;

      try {
        const historyRes = await sdk.quickAuth.fetch("/api/v1/me/games");
        if (historyRes.ok) {
          const games = await historyRes.json();
          const currentGame = games.find(
            (g: { gameId: number; answeredQuestions?: number }) =>
              g.gameId === gameInfo.id
          );
          const answeredCount = currentGame?.answeredQuestions ?? 0;

          // If user has already completed all questions, redirect to score
          if (answeredCount >= gameInfo.questions.length) {
            router.push(`/game/${gameInfo.id}/score`);
            return;
          }

          setInitialQuestionIndex(answeredCount);
          setCurrentQuestionIndex(answeredCount);
        } else {
          // No history, start from 0
          setInitialQuestionIndex(0);
          setCurrentQuestionIndex(0);
        }
      } catch (error) {
        console.error("Error fetching game progress:", error);
        setInitialQuestionIndex(0);
        setCurrentQuestionIndex(0);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProgress();
  }, [gameInfo, router]);

  // PartyKit Integration (auth verified by layout)
  const { onlineCount, messages, events, sendChat, sendEvent } = usePartyGame({
    gameId: gameInfo?.id?.toString() ?? "",
    enabled: !!gameInfo,
  });

  // Get the duration for the *current* question
  const questionTotalTime =
    (gameInfo?.questions[currentQuestionIndex]?.durationSec ?? 10) +
    EXTRA_TIME_SECONDS;

  // Reveals the next question after round countdown completes
  const handleRoundCountdownComplete = React.useCallback(() => {
    setShowRoundCountdown(false);
    setCurrentQuestionIndex((prev) => prev + 1);
  }, []);

  // This function decides what to do after a question's time is up
  const handleQuestionCompleted = React.useCallback(() => {
    const nextQuestionIndex = currentQuestionIndex + 1;
    const questions = gameInfo?.questions || [];

    // If we've reached the end of the questions, redirect to the score page
    if (nextQuestionIndex >= questions.length) {
      router.push(`/game/${gameInfo?.id}/score`);
      return;
    }

    // Decide if round countdown is needed before next question
    if (shouldShowRoundCountdown(currentQuestionIndex, questions)) {
      setShowRoundCountdown(true);
      return;
    }

    // Otherwise, advance to the next question immediately
    setCurrentQuestionIndex(nextQuestionIndex);
  }, [currentQuestionIndex, gameInfo?.questions, gameInfo?.id, router]);

  // Loading state
  if (isLoading || initialQuestionIndex === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <WaffleLoader text="LOADING GAME..." />
      </div>
    );
  }

  // Ensure we have game info and questions
  if (!gameInfo || !gameInfo.questions || gameInfo.questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/60">
        Loading game questions...
      </div>
    );
  }

  return (
    <>
      {showRoundCountdown ? (
        <RoundCountdownCard
          duration={gameInfo?.roundBreakSec ?? 15}
          onComplete={handleRoundCountdownComplete}
          gameId={gameInfo?.id ?? null}
          nextRoundNumber={gameInfo?.questions[currentQuestionIndex + 1]?.roundIndex ?? 1}
          // Pass realtime props
          liveEvents={events}
          onlineCount={onlineCount}
          chatMessages={messages}
          onSendChat={sendChat}
        />
      ) : (
        <QuestionCard
          question={gameInfo.questions[currentQuestionIndex]}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={gameInfo.questions.length}
          duration={questionTotalTime}
          onComplete={handleQuestionCompleted}
          onAnswerSubmitted={(isCorrect) => {
            if (isCorrect) {
              sendEvent({
                type: "answer",
                content: "answered correctly!",
              });
            }
          }}
        />
      )}
    </>
  );
}
