"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/miniapp-sdk";

import { useGameStore, selectEntry } from "@/lib/game-store";
import { useLive } from "@/hooks/useLive";
import { WaffleLoader } from "@/components/ui/WaffleLoader";

import QuestionCard from "./_components/QuestionCard";
import RoundCountdownCard from "./_components/RoundCountdownCard";

import type { LiveGameData, LiveGameQuestion } from "./page";

// ==========================================
// HELPERS
// ==========================================

function shouldShowRoundCountdown(
  currentIdx: number,
  questions: LiveGameQuestion[]
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

// ==========================================
// PROPS
// ==========================================

interface LiveGameClientProps {
  game: LiveGameData;
}

// ==========================================
// COMPONENT
// ==========================================

export default function LiveGameClient({ game }: LiveGameClientProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showRoundCountdown, setShowRoundCountdown] = useState(false);

  // Store - use exported selectors
  const entry = useGameStore(selectEntry);

  // Get actions from store
  const { updateScore, incrementAnswered } = useGameStore.getState();

  // Real-time connection
  const { sendEvent } = useLive({
    gameId: game.id,
    token: "", // Token already connected from parent
    enabled: true,
  });

  // Fetch user's progress on mount
  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await sdk.quickAuth.fetch(`/api/v1/games/${game.id}/entry`);
        if (res.ok) {
          const data = await res.json();
          const answeredCount = data.answered ?? 0;

          // If user has completed all questions, redirect to results
          if (answeredCount >= game.questions.length) {
            router.push(`/game/results?id=${game.id}`);
            return;
          }

          // Start from where they left off
          setCurrentQuestionIndex(answeredCount);
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgress();
  }, [game.id, game.questions.length, router]);

  // Handle round countdown complete
  const handleRoundCountdownComplete = useCallback(() => {
    setShowRoundCountdown(false);
    setCurrentQuestionIndex((prev) => prev + 1);
  }, []);

  // Handle question complete
  const handleQuestionComplete = useCallback(() => {
    const nextIdx = currentQuestionIndex + 1;

    // Check if game is complete
    if (nextIdx >= game.questions.length) {
      router.push(`/game/results?id=${game.id}`);
      return;
    }

    // Check if we need round countdown
    if (shouldShowRoundCountdown(currentQuestionIndex, game.questions)) {
      setShowRoundCountdown(true);
      return;
    }

    // Move to next question
    setCurrentQuestionIndex(nextIdx);
  }, [currentQuestionIndex, game.questions, game.id, router]);

  // Handle answer submission
  const handleAnswer = useCallback(
    (selectedIndex: number, isCorrect: boolean, points: number) => {
      // Optimistic update
      updateScore(isCorrect ? points : 0);
      incrementAnswered();

      // Broadcast event
      if (isCorrect) {
        sendEvent("answer", "answered correctly!");
      }
    },
    [updateScore, incrementAnswered, sendEvent]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <WaffleLoader text="LOADING GAME..." />
      </div>
    );
  }

  // No questions
  if (!game.questions || game.questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/60">
        No questions available
      </div>
    );
  }

  const currentQuestion = game.questions[currentQuestionIndex];

  // Round countdown
  if (showRoundCountdown) {
    return (
      <RoundCountdownCard
        duration={game.roundBreakSec}
        onComplete={handleRoundCountdownComplete}
        nextRoundNumber={game.questions[currentQuestionIndex + 1]?.roundIndex ?? 1}
      />
    );
  }

  // Question
  return (
    <QuestionCard
      question={currentQuestion}
      gameId={game.id}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={game.questions.length}
      onComplete={handleQuestionComplete}
      onAnswer={handleAnswer}
    />
  );
}
