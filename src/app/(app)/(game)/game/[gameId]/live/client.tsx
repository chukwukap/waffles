"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/miniapp-sdk";

import { usePartyGame } from "@/hooks/usePartyGame";
import QuestionCard from "./_components/QuestionCard";
import RoundCountdownCard from "./_components/RoundCountdownCard";
import { LiveGameInfoPayload } from "./page";
import { useSound } from "@/components/providers/SoundContext";
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

  if (
    typeof thisRoundIndex === "number" &&
    typeof nextRoundIndex === "number" &&
    nextRoundIndex > thisRoundIndex
  ) {
    return true;
  }
  return false;
}

interface UserInfo {
  fid: number;
  status: string;
  username: string;
}

export default function LiveGameClient({
  gameInfo,
}: {
  gameInfo: LiveGameInfoPayload | null;
}) {
  const router = useRouter();
  const { playSound } = useSound();

  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null);
  const [initialQuestionIndex, setInitialQuestionIndex] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [showRoundCountdown, setShowRoundCountdown] = React.useState(false);

  // Fetch user data and answer progress on mount
  React.useEffect(() => {
    async function fetchUserDataAndProgress() {
      if (!gameInfo) return;

      try {
        // Fetch user profile
        const userRes = await sdk.quickAuth.fetch("/api/v1/me");
        if (!userRes.ok) {
          if (userRes.status === 401) {
            router.push("/invite");
            return;
          }
          throw new Error("Failed to fetch user");
        }
        const userData = await userRes.json();

        // Check authorization
        if (userData.status !== "ACTIVE") {
          router.push("/invite");
          return;
        }

        setUserInfo(userData);

        // Fetch user's game history to determine progress
        const historyRes = await sdk.quickAuth.fetch(`/api/v1/me/games`);
        if (historyRes.ok) {
          const games = await historyRes.json();
          const currentGame = games.find((g: { gameId: number; answeredQuestions?: number }) => g.gameId === gameInfo.id);
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
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserDataAndProgress();
  }, [gameInfo, router]);

  // PartyKit Integration
  const { isConnected, onlineCount, messages, events, sendChat, sendEvent } = usePartyGame({
    gameId: gameInfo?.id?.toString() ?? "",
    enabled: !!gameInfo && !!userInfo,
  });

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
      router.push(`/game/${gameInfo?.id}/score`);
      return;
    }

    // Decide if round countdown is needed before next question
    if (shouldShowRoundCountdown(currentQuestionIndex, questions)) {
      setShowRoundCountdown(true);
      return;
    }

    // Otherwise, advance to the next question immediately
    playSound("nextQuestion");
    setCurrentQuestionIndex(nextQuestionIndex);
  }, [currentQuestionIndex, gameInfo?.questions, gameInfo?.id, router, playSound]);

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

  if (!userInfo) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/60">
        Please sign in to play
      </div>
    );
  }

  return (
    <>
      {showRoundCountdown ? (
        <RoundCountdownCard
          duration={gameInfo?.roundDurationSec ?? 15}
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
