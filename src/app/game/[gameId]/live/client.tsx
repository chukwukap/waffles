"use client";
import { Prisma } from "@prisma/client";
import * as React from "react";

import QuestionCard from "./_components/QuestionCard";

import { submitAnswerAction, completeRoundAction } from "@/actions/game";
import { useAuth } from "@/hooks/useAuth";
import { EXTRA_TIME_SECONDS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import RoundCountdownCard from "./_components/RoundCountdownCard";

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

  console.log("game questions: ", gameInfo?.questions);

  const questionTotalTime =
    gameInfo?.config?.questionTimeLimit ?? 10 + EXTRA_TIME_SECONDS;
  const answerCount = userInfo?._count.answers;
  const question = gameInfo?.questions[answerCount!];
  // next question is the question after the current question.
  const isLastQuestionInRound =
    (answerCount! + 1) % (gameInfo?.config?.questionsPerGame ?? 1) === 0;
  console.log("question: ", question);
  console.log("questoin index: ", answerCount);
  console.log("answers: ", answerCount);
  console.log("last question in round: ", isLastQuestionInRound);
  const { getToken, signIn } = useAuth();

  const [selectedOptionIndex, setSelectedOptionIndex] = React.useState<
    number | null
  >(null);
  const [questionStartTime, setQuestionStartTime] = React.useState<
    number | null
  >(null);
  const [questionEndTime, setQuestionEndTime] = React.useState<number | null>(
    null
  );
  const [actionState, action, pending] = React.useActionState(
    submitAnswerAction,
    {
      error: "",
      success: false,
    }
  );

  // Track when question phase starts to calculate time taken
  React.useEffect(() => {
    if (question) {
      setQuestionStartTime(Date.now());
      setQuestionEndTime(null);
      setSelectedOptionIndex(null); // Reset selection for new question
    }
  }, [question]);

  // Track when question phase ends (moves to next question)
  React.useEffect(() => {
    if (questionStartTime && !questionEndTime) {
      setQuestionEndTime(Date.now());
    }
  }, [questionStartTime, questionEndTime]);

  const submitOption = React.useCallback(
    async (qIdx: number, opIndex: number | null) => {
      if (!gameInfo || !userInfo || !gameInfo.questions[qIdx]) {
        return;
      }

      const questionTimeLimit =
        gameInfo.config?.questionTimeLimit ?? 10 + EXTRA_TIME_SECONDS;

      // Calculate time taken (in seconds) from question start to question end

      const endTime = questionEndTime ?? Date.now();

      const timeTaken =
        questionStartTime && endTime
          ? Math.min((endTime - questionStartTime) / 1000, questionTimeLimit)
          : questionTimeLimit;

      // Get selected answer option or null if no selection

      const selected = opIndex !== null ? question?.options[opIndex] : null;

      // Get auth token (authenticate if needed)

      let authToken = getToken();

      if (!authToken) {
        authToken = await signIn();

        if (!authToken) {
          console.error("Authentication required to submit answer");

          return;
        }
      }

      // Create FormData with all required fields

      const formData = new FormData();

      formData.append("fid", String(userInfo.fid));

      formData.append("gameId", String(gameInfo.id));

      formData.append("questionId", String(question?.id ?? ""));

      formData.append("timeTaken", String(timeTaken));

      formData.append("authToken", authToken);

      if (selected !== null) {
        formData.append("selected", selected ?? "");
      }
      // Submit the answer
      React.startTransition(() => {
        action(formData);
      });
    },
    [
      gameInfo,
      userInfo,
      questionEndTime,
      questionStartTime,
      question?.options,
      question?.id,
      getToken,
      signIn,
      action,
    ]
  );

  const handleQuestionDone = React.useCallback(() => {
    console.log("question done, submitting option....", selectedOptionIndex);

    submitOption(answerCount!, selectedOptionIndex);
    console.log("new state", actionState);

    const next = answerCount! + 1;

    if (next >= (gameInfo?.questions.length ?? 0)) {
      router.push(`/game/${gameInfo?.id}/score/?fid=${userInfo?.fid}`);

      return;
    }

    // Check if next question is in a different round using Round model
    const nextQuestion = gameInfo?.questions[next];
    const isEndOfRound =
      question?.round.roundNum !== nextQuestion?.round.roundNum;
    if (isEndOfRound) {
    } else {
      // router.refresh();
    }
  }, [
    selectedOptionIndex,
    answerCount,
    submitOption,
    userInfo?.fid,
    actionState,
    gameInfo?.questions,
    gameInfo?.id,
    question?.round.roundNum,
    router,
  ]);

  // change selected option index and update question end time if it is different from the current one.
  const handleSelectOption = React.useCallback(
    (index: number | null) => {
      console.log("setting option index to", index);
      setSelectedOptionIndex(index);
      if (selectedOptionIndex !== index) {
        setQuestionEndTime(Date.now());
      }
    },
    [setSelectedOptionIndex, selectedOptionIndex]
  );

  // Handle round countdown completion
  const handleRoundCountdownComplete = React.useCallback(async () => {
    if (!userInfo || !gameInfo || !question) {
      console.error("Missing data for round completion");
      return;
    }

    // Get auth token
    let authToken = getToken();
    if (!authToken) {
      authToken = await signIn();
      if (!authToken) {
        console.error("Authentication required to complete round");
        return;
      }
    }

    // Mark round as completed
    const result = await completeRoundAction({
      fid: userInfo.fid,
      gameId: gameInfo.id,
      roundId: question.round.id,
      authToken,
    });

    if (result.success) {
      console.log("Round completed successfully");
      // Refresh to get next question
      router.refresh();
    } else {
      console.error("Failed to complete round:", result.error);
    }
  }, [userInfo, gameInfo, question, getToken, signIn, router]);

  console.log("question >>>>>>>>>>>>>>>>>>>>>>>>>>> client:", question);

  return (
    <>
      {isLastQuestionInRound ? (
        <RoundCountdownCard
          duration={gameInfo?.config?.roundTimeLimit ?? 15}
          onComplete={handleRoundCountdownComplete}
        />
      ) : (
        <QuestionCard
          question={question!}
          questionNumber={answerCount! + 1}
          totalQuestions={gameInfo?.questions.length ?? 0}
          duration={questionTotalTime}
          submitting={pending}
          onComplete={handleQuestionDone}
          selectedOptionIndex={selectedOptionIndex}
          onSelectOption={handleSelectOption}
        />
      )}
    </>
  );
}
