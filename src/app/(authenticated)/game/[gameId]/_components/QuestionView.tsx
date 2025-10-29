"use client";

import * as React from "react";
import { useTimer } from "@/hooks/useTimer";
import SoundManager from "@/lib/SoundManager";
import { notify } from "@/components/ui/Toaster";
import { HydratedGame, HydratedUser } from "@/state/types";
import { submitAnswerAction } from "@/actions/game";
import QuestionCard from "./QuestionCard";
import { useRouter } from "next/navigation";
import { QuestionHeader } from "./QuestionCardHeader";
import { isSnapshot } from "@/lib/utils";
import RoundCountdownView from "./RoundCountdownView";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const NEXT_QUESTION_DELAY_SECONDS = 3;

export default function QuestionView({
  game,
  userInfo,
}: {
  game: HydratedGame;
  userInfo: HydratedUser;
}) {
  const { prefs } = useUserPreferences();
  const router = useRouter();

  const questionTimeLimitMs = (game?.config?.questionTimeLimit ?? 10) * 1000;
  const nextQuestionDelayMs = NEXT_QUESTION_DELAY_SECONDS * 1000;

  // Track question start time (ms)
  const questionStartTimeRef = React.useRef<number | null>(null);

  // get the list of questions the user haven't answered yet
  const unansweredQuestions = game?.questions?.filter(
    (question) =>
      !userInfo?.answers?.some((answer) => answer.questionId === question.id)
  );

  if (unansweredQuestions?.length === 0) {
    router.push(`/game/${game?.id}/score`);
  }

  // Timer for next question transition
  const roundTimer = useTimer({
    duration: game?.config?.roundTimeLimit ?? 15 * 1000,
    autoStart: false,
    onComplete: () => {
      console.log("Round timer completed, advancing question.");
      handleAnswerClick("no answer", unansweredQuestions?.[0]?.id);
      questionTimer.start();
    },
  });

  // Timer for next question transition
  const questionGapTimer = useTimer({
    duration: nextQuestionDelayMs,
    autoStart: false,
    onComplete: () => {
      console.log("Next question timer completed, advancing question.");
      handleAnswerClick("no answer", unansweredQuestions?.[0]?.id);
      questionTimer.start();
    },
  });

  // Timer for question limit
  const questionTimer = useTimer({
    duration: questionTimeLimitMs,
    autoStart: true,
    onComplete: () => {
      questionGapTimer.start();
    },
  });

  const handleAnswerClick = React.useCallback(
    async (option: string, questionId: number) => {
      if (!game || !questionId) return;

      if (prefs.soundEnabled) SoundManager.play("click");

      console.log("Submitting answer:", questionId, option);

      if (!userInfo.fid) {
        console.error("Missing FID for submission.");
        notify.error("Cannot submit answer: User not identified.");
        return;
      }

      // Calculate time taken in seconds (may be fractional)
      const now = Date.now();
      let timeTakenSeconds = 0;
      if (questionStartTimeRef.current) {
        timeTakenSeconds = (now - questionStartTimeRef.current) / 1000;
      }

      const result = await submitAnswerAction({
        fid: userInfo.fid,
        gameId: game.id,
        questionId: questionId,
        selected: option,
        timeTaken: timeTakenSeconds,
      });

      console.log("Submission result:", result);

      router.refresh();
      if (!result.success) {
        console.error("Submission failed:", result.error);
        notify.error("Submission failed:");
      }
    },
    [userInfo.fid, game, prefs.soundEnabled, router]
  );

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto mt-4">
      {isSnapshot(
        game.questions.length - unansweredQuestions.length,
        game.questions.length
      ) ? (
        <RoundCountdownView
          gameId={game.id}
          roundTimer={roundTimer}
          fid={userInfo.fid}
        />
      ) : (
        <>
          <QuestionHeader
            currentQuestion={game.questions.length - unansweredQuestions.length}
            totalQuestions={game.questions.length}
            questionTimer={questionTimer}
            questionGapTimer={questionGapTimer}
            questionTimeLimit={game?.config?.questionTimeLimit ?? 10}
          />
          <QuestionCard
            question={unansweredQuestions?.[0]}
            handleAnswerClick={handleAnswerClick}
          />
        </>
      )}
    </div>
  );
}
