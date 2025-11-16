"use client";
import { Prisma } from "@prisma/client";
import * as React from "react";
import QuestionCard from "./_components/QuestionCard";
import { EXTRA_TIME_SECONDS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import RoundCountdownCard from "./_components/RoundCountdownCard";
import { useSound } from "@/components/providers/SoundContext";

/**
 * Determines if a round countdown should be shown before the next question.
 * Show countdown at the start of each new round (except the first question of the game).
 * @param currentIdx - The index of the current question
 * @param questions - The question list with `round.roundNum`
 * @returns boolean
 */
function shouldShowRoundCountdown(
  currentIdx: number,
  questions: { round: { id: number; roundNum: number } }[]
): boolean {
  if (!questions || questions.length === 0) return false;
  if (currentIdx + 1 >= questions.length) return false; // about to end

  const thisRound = questions[currentIdx]?.round?.roundNum;
  const nextRound = questions[currentIdx + 1]?.round?.roundNum;
  // Show round countdown if this is the last question in a round
  if (
    typeof thisRound === "number" &&
    typeof nextRound === "number" &&
    nextRound > thisRound
  ) {
    return true;
  }
  return false;
}

export default function LiveGameClient({
  gameInfoPromise,
  userInfoPromise,
}: {
  gameInfoPromise: Promise<Prisma.GameGetPayload<{
    include: {
      config: true;
      questions: {
        include: {
          round: {
            select: {
              id: true;
              roundNum: true;
            };
          };
        };
      };

      _count: { select: { answers: true } };
    };
  }> | null>;

  userInfoPromise: Promise<Prisma.UserGetPayload<{
    include: {
      _count: { select: { answers: true } };
    };
  }> | null>;
}) {
  const router = useRouter();
  const gameInfo = React.use(gameInfoPromise);
  const userInfo = React.use(userInfoPromise);
  const { playSound } = useSound();

  const questionTotalTime =
    (gameInfo?.config?.questionTimeLimit ?? 10) + EXTRA_TIME_SECONDS;
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);

  // Track whether we're currently displaying a round countdown
  const [showRoundCountdown, setShowRoundCountdown] = React.useState(false);

  // Reveals the next question after round countdown completes
  const handleRoundCountdownComplete = React.useCallback(() => {
    setShowRoundCountdown(false);
    playSound("nextQuestion");
    setCurrentQuestionIndex((prev) => prev + 1);
  }, [playSound]);

  // This function decides whether we should move to the next question or redirect to the score page,
  // also checks if a round countdown should show before next question.
  const handleQuestionCompleted = React.useCallback(() => {
    const nextQuestionIndex = currentQuestionIndex + 1;
    const questions = gameInfo?.questions || [];

    // If we've reached the end of the questions, redirect to the score page
    if (nextQuestionIndex >= questions.length) {
      playSound("gameOver");
      router.push(`/game/${gameInfo?.id}/score/?fid=${userInfo?.fid}`);
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

  return (
    <>
      {showRoundCountdown ? (
        <RoundCountdownCard
          duration={gameInfo?.config?.roundTimeLimit ?? 15}
          onComplete={handleRoundCountdownComplete}
          gameId={gameInfo?.id ?? null}
        />
      ) : (
        <QuestionCard
          question={gameInfo!.questions[currentQuestionIndex]}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={gameInfo?.questions.length ?? 0}
          duration={questionTotalTime}
          onComplete={handleQuestionCompleted}
        />
      )}
    </>
  );
}
