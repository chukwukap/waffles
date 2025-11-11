"use client";

import { Prisma } from "@prisma/client";
import * as React from "react";
import QuestionCard from "./_components/QuestionCard";
import RoundCountdownCard from "./_components/RoundCountdownCard";
import { submitAnswerAction } from "@/actions/game";
import { useAuth } from "@/hooks/useAuth";

export type Phase = "question" | "extra" | "round" | "done";

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
  const gameInfo = React.use(gameInfoPromise);
  const userInfo = React.use(userInfoPromise);
  const { getToken, signIn } = useAuth();

  const [phase, setPhase] = React.useState<Phase>("question");
  const [questionIndex, setQuestionIndex] = React.useState(() => {
    return userInfo?._count.answers ?? 0;
  });
  const [selectedAnswerIndex, setSelectedAnswerIndex] = React.useState<
    number | null
  >(null);
  const [questionStartTime, setQuestionStartTime] = React.useState<
    number | null
  >(null);
  const [questionEndTime, setQuestionEndTime] = React.useState<number | null>(
    null
  );
  const [, action, pending] = React.useActionState(submitAnswerAction, {
    error: "",
    success: false,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Track when question phase starts to calculate time taken
  React.useEffect(() => {
    if (phase === "question" && gameInfo?.questions[questionIndex]) {
      setQuestionStartTime(Date.now());
      setQuestionEndTime(null);
      setSelectedAnswerIndex(null); // Reset selection for new question
    }
  }, [phase, questionIndex, gameInfo?.questions]);

  // Track when question phase ends (moves to extra phase)
  React.useEffect(() => {
    if (phase === "extra" && questionStartTime && !questionEndTime) {
      setQuestionEndTime(Date.now());
    }
  }, [phase, questionStartTime, questionEndTime]);

  // Submit answer when extra phase ends
  const submitAnswer = React.useCallback(async () => {
    if (!gameInfo || !userInfo || !gameInfo.questions[questionIndex]) {
      return false;
    }

    setIsSubmitting(true);

    const question = gameInfo.questions[questionIndex];
    const questionTimeLimit = gameInfo.config?.questionTimeLimit ?? 10;

    // Calculate time taken (in seconds) from question start to question end
    // Use questionEndTime if available, otherwise fall back to current time
    const endTime = questionEndTime ?? Date.now();
    const timeTaken =
      questionStartTime && endTime
        ? Math.min((endTime - questionStartTime) / 1000, questionTimeLimit)
        : questionTimeLimit;

    // Get selected answer option or null if no selection
    const selected =
      selectedAnswerIndex !== null
        ? question.options[selectedAnswerIndex] ?? null
        : null;

    // Get auth token (authenticate if needed)
    let authToken = getToken();
    if (!authToken) {
      authToken = await signIn();
      if (!authToken) {
        console.error("Authentication required to submit answer");
        setIsSubmitting(false);
        return false;
      }
    }

    // Create FormData with all required fields
    const formData = new FormData();
    formData.append("fid", String(userInfo.fid));
    formData.append("gameId", String(gameInfo.id));
    formData.append("questionId", String(question.id));
    formData.append("timeTaken", String(timeTaken));
    formData.append("authToken", authToken);
    if (selected !== null) {
      formData.append("selected", selected);
    }

    // Submit the answer
    await action(formData);
    return true;
  }, [
    gameInfo,
    userInfo,
    questionIndex,
    selectedAnswerIndex,
    questionStartTime,
    questionEndTime,
    getToken,
    signIn,
    action,
  ]);

  // Navigate to next question/round after submission completes
  React.useEffect(() => {
    if (phase === "extra" && isSubmitting && !pending) {
      // Submission completed, now navigate to next phase
      setIsSubmitting(false);

      const next = questionIndex + 1;
      if (next >= (gameInfo?.questions.length ?? 0)) {
        setPhase("done");
        return;
      }

      // Check if next question is in a different round using Round model
      const currentQuestion = gameInfo?.questions[questionIndex];
      const nextQuestion = gameInfo?.questions[next];
      const isEndOfRound =
        currentQuestion?.round.roundNum !== nextQuestion?.round.roundNum;

      if (isEndOfRound) {
        setPhase("round");
      } else {
        setQuestionIndex(next);
        setPhase("question");
      }
    }
  }, [phase, isSubmitting, pending, questionIndex, gameInfo?.questions]);

  // Whenever a phase finishes, call this to move forward
  const nextPhase = async () => {
    switch (phase) {
      case "question":
        setPhase("extra");
        break;
      case "extra": {
        // Don't navigate if submission is still pending
        if (pending || isSubmitting) {
          return;
        }

        // Submit answer - navigation will happen in useEffect when submission completes
        await submitAnswer();
        break;
      }
      case "round": {
        const next = questionIndex + 1;
        setQuestionIndex(next);
        setPhase("question");
        break;
      }
      default:
        break;
    }
  };

  return (
    <>
      {phase === "question" && gameInfo?.questions && (
        <QuestionCard
          question={gameInfo?.questions[questionIndex]}
          phase={phase}
          totalQuestions={gameInfo?.questions.length ?? 0}
          questionNumber={questionIndex + 1}
          duration={gameInfo?.config?.questionTimeLimit ?? 10}
          pending={pending}
          onComplete={nextPhase}
          selectedAnswerIndex={selectedAnswerIndex}
          onAnswerSelect={setSelectedAnswerIndex}
        />
      )}
      {phase === "extra" && gameInfo?.questions && (
        <QuestionCard
          question={gameInfo?.questions[questionIndex]}
          phase={phase}
          totalQuestions={gameInfo?.questions.length ?? 0}
          questionNumber={questionIndex + 1}
          duration={3}
          onComplete={nextPhase}
          pending={pending}
          selectedAnswerIndex={selectedAnswerIndex}
          onAnswerSelect={setSelectedAnswerIndex}
        />
      )}
      {phase === "round" && (
        <RoundCountdownCard
          duration={gameInfo?.config?.roundTimeLimit ?? 15}
          onComplete={nextPhase}
        />
      )}
      {phase === "done" && (
        <div className="text-center p-4">Game finished!</div>
      )}
    </>
  );
}
