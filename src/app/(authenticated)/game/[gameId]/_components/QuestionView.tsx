"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import SoundManager from "@/lib/SoundManager";
import { notify } from "@/components/ui/Toaster";
import { NeccessaryGameInfo, NeccessaryUserInfo } from "../page";
import { submitAnswerAction } from "@/actions/game";
import QuestionCard from "./QuestionCard";
import { QuestionHeader } from "./QuestionCardHeader";
import { isSnapshot, formatMsToMMSS } from "@/lib/utils";
import RoundCountdownView from "./RoundCountdownView";
import { useUserPreferences } from "@/components/providers/userPreference";

// ───────────────────────── CONSTANTS ─────────────────────────
const NEXT_QUESTION_DELAY_SECONDS = 3;
const TIMER_PRECISION_MS = 100;

type QuestionState = "SHOWING_ROUND_BREAK" | "SHOWING_QUESTION" | "SHOWING_GAP";

export default function QuestionView({
  game,
  userInfo,
}: {
  game: NeccessaryGameInfo;
  userInfo: NeccessaryUserInfo;
}) {
  const { prefs } = useUserPreferences();
  const router = useRouter();

  const [selectedOption, setSelectedOption] = React.useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const selectedOptionRef = React.useRef(selectedOption);
  React.useEffect(() => {
    selectedOptionRef.current = selectedOption;
  }, [selectedOption]);

  const questionTimeLimitMs = (game?.config?.questionTimeLimit ?? 10) * 1000;
  const roundTimeLimitMs = (game?.config?.roundTimeLimit ?? 15) * 1000;
  const gapTimeLimitMs = NEXT_QUESTION_DELAY_SECONDS * 1000;

  const totalQuestions = game?._count.questions ?? 0;
  const answeredCount = userInfo?._count.answers ?? 0;
  const currentQuestion = game?.questions[answeredCount];
  const currentQuestionId = currentQuestion?.id;

  console.log("currentQuestion", currentQuestion);
  console.log("currentQuestionId", currentQuestionId);
  console.log("answeredCount", answeredCount);
  console.log("totalQuestions", totalQuestions);
  console.log("roundTimeLimitMs", roundTimeLimitMs);
  console.log("questionTimeLimitMs", questionTimeLimitMs);
  console.log("gapTimeLimitMs", gapTimeLimitMs);
  console.log("prefs.soundEnabled", prefs.soundEnabled);
  console.log("prefs.soundEnabled", prefs.soundEnabled);

  const [state, setState] = React.useState<QuestionState>(() => {
    const isBreak =
      isSnapshot(answeredCount, totalQuestions) &&
      answeredCount > 0 &&
      answeredCount !== totalQuestions;
    return isBreak ? "SHOWING_ROUND_BREAK" : "SHOWING_QUESTION";
  });
  const [deadline, setDeadline] = React.useState<number>(0);
  const [now, setNow] = React.useState<number>(Date.now());
  const questionStartTimeRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!currentQuestion) return;
    if (!prefs.soundEnabled) return;

    SoundManager.stopAll();

    console.log("playing question sound", currentQuestion.soundUrl);
    SoundManager.play(currentQuestion.soundUrl!, { volume: 1 });

    return () => {
      console.log("stopping question sound", currentQuestion.soundUrl);
      SoundManager.stop(currentQuestion.soundUrl!);
    };
  }, [currentQuestion, prefs.soundEnabled]);

  React.useEffect(() => {
    if (state === "SHOWING_ROUND_BREAK" && prefs.soundEnabled) {
      console.log("playing round break sound");
      SoundManager.play("roundBreak", { loop: true, volume: 0.4 });
      return () => {
        console.log("stopping round break sound");
        SoundManager.stop("roundBreak");
      };
    }
  }, [state, prefs.soundEnabled]);

  // ───────────────────────── ANSWER SUBMISSION ─────────────────────────
  // Memoize the submission handler
  const handleAnswerClick = React.useCallback(
    async (option: string, questionId: number) => {
      if (!game || !questionId) return;
      if (prefs.soundEnabled) SoundManager.play("click");
      if (!userInfo.fid) {
        notify.error("Cannot submit answer: User not identified.");
        return;
      }

      setIsSubmitting(true); // <-- SET LOADING STATE

      const timeTakenMs =
        questionStartTimeRef.current != null
          ? Date.now() - questionStartTimeRef.current
          : 0;
      const timeTakenSeconds = timeTakenMs / 1000;

      const result = await submitAnswerAction({
        fid: userInfo.fid,
        gameId: game.id,
        questionId,
        selected: option,
        timeTaken: timeTakenSeconds,
      });

      // Check if this was the last question
      // Note: answeredCount is from props, so it's 1 behind the *new* count
      if (answeredCount + 1 === totalQuestions) {
        router.push(`/game/${game.id}/score?fid=${userInfo.fid}`);
        return;
      }

      // Refresh to get the next question data
      if (!result.success) {
        notify.error("Submission failed:");
        setIsSubmitting(false); // <-- UNSET ON ERROR
        setSelectedOption(null);
      } else {
        setIsSubmitting(false);
        setSelectedOption(null);
        router.refresh(); // <-- Success will trigger unmount
      }
    },
    [
      userInfo.fid,
      game,
      prefs.soundEnabled,
      router,
      answeredCount,
      totalQuestions,
    ]
  );

  // Ref to hold the latest version of the submission handler
  const handleAnswerClickRef = React.useRef(handleAnswerClick);
  React.useEffect(() => {
    handleAnswerClickRef.current = handleAnswerClick;
  }, [handleAnswerClick]);

  // ───────────────────────── TIMER STATE MACHINE ─────────────────────────
  React.useEffect(() => {
    // This effect runs when the question changes (based on currentQuestionId)
    if (!currentQuestionId) {
      // No more questions, submission handler will redirect
      return;
    }

    // 1. Set initial state and deadline for this question
    const startTime = Date.now();
    setNow(startTime);

    const isBreak =
      isSnapshot(answeredCount, totalQuestions) &&
      answeredCount > 0 &&
      answeredCount !== totalQuestions;

    const initialState: QuestionState = isBreak
      ? "SHOWING_ROUND_BREAK"
      : "SHOWING_QUESTION";
    let currentDeadline: number;

    if (initialState === "SHOWING_ROUND_BREAK") {
      currentDeadline = startTime + roundTimeLimitMs;
    } else {
      // This is the start of the question
      questionStartTimeRef.current = startTime;
      currentDeadline = startTime + questionTimeLimitMs;
    }

    setState(initialState);
    setDeadline(currentDeadline);

    // 2. Start the interval timer
    const interval = setInterval(() => {
      const timeNow = Date.now();
      setNow(timeNow); // Update 'now' for UI rendering

      // 3. Check if the deadline has been reached
      if (timeNow > currentDeadline) {
        // Time's up, transition to the next state
        setState((prevState) => {
          if (prevState === "SHOWING_ROUND_BREAK") {
            // Break is over, start the question
            questionStartTimeRef.current = timeNow;
            currentDeadline = timeNow + questionTimeLimitMs;
            setDeadline(currentDeadline);
            return "SHOWING_QUESTION";
          }

          if (prevState === "SHOWING_QUESTION") {
            // Question time is over, start the gap
            currentDeadline = timeNow + gapTimeLimitMs;
            setDeadline(currentDeadline);
            return "SHOWING_GAP";
          }

          if (prevState === "SHOWING_GAP") {
            // Gap time is over, submit the answer
            clearInterval(interval); // Stop the timer

            // Use refs to get the latest values
            const finalOption = selectedOptionRef.current ?? "noanswer";
            handleAnswerClickRef.current(finalOption, currentQuestionId);

            // Submission will trigger refresh/redirect, so just stop
            return prevState;
          }

          return prevState; // Should not happen
        });
      }
    }, TIMER_PRECISION_MS);

    // 4. Cleanup
    return () => {
      clearInterval(interval);
    };
  }, [
    currentQuestionId, // This is the key dependency
    answeredCount,
    totalQuestions,
    roundTimeLimitMs,
    questionTimeLimitMs,
    gapTimeLimitMs,
    // handleAnswerClickRef and selectedOptionRef are refs, not needed here
  ]);

  // ───────────────────────── RENDER VALUES ─────────────────────────
  const remainingTimeMs = Math.max(0, deadline - now);
  const formattedTime = formatMsToMMSS(remainingTimeMs);

  let percent = 0;
  if (state === "SHOWING_QUESTION") {
    percent =
      questionTimeLimitMs > 0 ? remainingTimeMs / questionTimeLimitMs : 0;
  } else if (state === "SHOWING_GAP") {
    percent = gapTimeLimitMs > 0 ? remainingTimeMs / gapTimeLimitMs : 0;
  } else if (state === "SHOWING_ROUND_BREAK") {
    percent = roundTimeLimitMs > 0 ? remainingTimeMs / roundTimeLimitMs : 0;
  }
  percent = Math.max(0, Math.min(1, percent)); // Clamp between 0 and 1

  // ───────────────────────── RENDER ─────────────────────────
  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto mt-">
      {state === "SHOWING_ROUND_BREAK" ? (
        // Pass timer values to the round countdown view
        <RoundCountdownView
          percent={percent}
          secondsLeft={Math.ceil(remainingTimeMs / 1000)} // <-- FIX: Pass seconds
          totalSeconds={Math.ceil(roundTimeLimitMs / 1000)} // <-- FIX: Pass seconds
        />
      ) : (
        <>
          <QuestionHeader
            state={state}
            formattedTime={formattedTime}
            currentQuestion={answeredCount} // Note: This is 0-indexed for the *next* question
            totalQuestions={totalQuestions}
            questionTimeLimit={questionTimeLimitMs / 1000} // Pass in seconds
          />
          <QuestionCard
            question={currentQuestion}
            onSelectAnswer={(option) => {
              if (isSubmitting) return; // <-- Don't allow clicks while submitting
              setSelectedOption(option);
            }}
            selectedOption={selectedOption}
            isSubmitting={isSubmitting} // <-- Pass state down
          />
        </>
      )}
    </div>
  );
}
