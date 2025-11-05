"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import SoundManager from "@/lib/SoundManager";
import { notify } from "@/components/ui/Toaster";
import { NeccessaryGameInfo, NeccessaryUserInfo } from "../page";
import { submitAnswerAction } from "@/actions/game";
import QuestionCard from "./QuestionCard";
import { QuestionHeader } from "./QuestionCardHeader";
import { formatMsToMMSS } from "@/lib/utils";
import { useUserPreferences } from "@/components/providers/userPreference";
import { useTimer } from "@/hooks/useTimer";

// Define the states for the timer
type TimerState = "QUESTION" | "GAP" | "TIMES_UP";

// Define state constants for clarity, matching the original code's intent
const QUESTION_STATE = "SHOWING_QUESTION";
const GAP_STATE = "SHOWING_GAP";

export default function QuestionView({
  gameInfo,
  userInfo,
}: {
  gameInfo: NeccessaryGameInfo;
  userInfo: NeccessaryUserInfo;
}) {
  const { prefs } = useUserPreferences();
  const router = useRouter();

  // State for the current timer phase: 'QUESTION' or 'GAP'
  const [timerState, setTimerState] = React.useState<TimerState>("QUESTION");
  // State for the user's selected answer
  const [selectedOption, setSelectedOption] = React.useState<string | null>(
    null
  );
  // useTransition provides the "isSubmitting" state for server actions
  const [isSubmitting, startTransition] = React.useTransition();

  const totalQuestions = gameInfo?._count.questions ?? 0;
  const answeredCount = userInfo?._count.answers ?? 0;
  const currentQuestion = gameInfo?.questions[answeredCount];

  // --- Timer Durations ---
  const questionTimeLimitMs =
    (gameInfo?.config?.questionTimeLimit ?? 10) * 1000;
  const gapTimeMs = 3000; // 3-second grace period

  // --- Timer for the 'QUESTION' state ---
  const questionTimer = useTimer({
    duration: questionTimeLimitMs,
    autoStart: true,
    onComplete: () => {
      // When question time is up, move to 'GAP' state
      setTimerState("GAP");
    },
  });

  // --- Timer for the 'GAP' state ---
  const gapTimer = useTimer({
    duration: gapTimeMs,
    // Only auto-start this timer *after* the state changes to 'GAP'
    autoStart: timerState === "GAP",
    onComplete: () => {
      // When gap time is up, refresh the page to get the next question
      // The server will see the user's last submitted answer
      setTimerState("TIMES_UP");
      router.refresh();
    },
  });

  // --- Sound Effects ---
  React.useEffect(() => {
    if (!currentQuestion || !prefs.soundEnabled) return;

    SoundManager.stopAll();
    // Play the sound URL associated with the question
    if (currentQuestion.soundUrl) {
      SoundManager.play(currentQuestion.soundUrl, { volume: 1, loop: true });
    } else {
      SoundManager.play("questionStart", { volume: 0.5 });
    }

    return () => {
      if (currentQuestion.soundUrl) {
        SoundManager.stop(currentQuestion.soundUrl);
      } else {
        SoundManager.stop("questionStart");
      }
    };
  }, [currentQuestion, prefs.soundEnabled]);

  // --- Answer Submission Handler ---
  const handleSelectAnswer = React.useCallback(
    (option: string) => {
      if (!gameInfo || !currentQuestion || timerState === "TIMES_UP") return;

      if (prefs.soundEnabled) SoundManager.play("click");

      // Set the selected option for the UI
      setSelectedOption(option);

      // Calculate time taken *from the question timer*
      const timeTakenSeconds = questionTimer.elapsed / 1000;

      // Call the server action within a transition
      // This updates the server in the background without a page refresh
      // and gives us the `isSubmitting` state
      startTransition(async () => {
        const result = await submitAnswerAction({
          fid: userInfo.fid,
          gameId: gameInfo.id,
          questionId: currentQuestion.id,
          selected: option,
          timeTaken: timeTakenSeconds,
        });

        if (!result.success) {
          notify.error(result.error || "Submission failed");
          // Optionally clear selection if submission fails
          // setSelectedOption(null);
        } else {
          // Success! The server has the answer.
          // We wait for the timer to run out to refresh.
        }
      });
    },
    [
      userInfo.fid,
      gameInfo,
      currentQuestion,
      prefs.soundEnabled,
      questionTimer.elapsed,
      timerState,
      startTransition,
    ]
  );

  // --- Determine Formatted Time for Header ---
  const formattedTime = React.useMemo(() => {
    if (timerState === "QUESTION") {
      return formatMsToMMSS(questionTimer.remaining);
    }
    if (timerState === "GAP") {
      return formatMsToMMSS(gapTimer.remaining);
    }
    // Default/fallback time
    return formatMsToMMSS(0);
  }, [timerState, questionTimer.remaining, gapTimer.remaining]);

  // --- Determine Header State ---
  const headerState = React.useMemo(() => {
    if (timerState === "QUESTION") return QUESTION_STATE;
    if (timerState === "GAP") return GAP_STATE;
    return null; // No timer in 'TIMES_UP'
  }, [timerState]);

  if (!currentQuestion) {
    // This can happen if the data is out of sync
    return (
      <div className="w-full max-w-md sm:max-w-lg mx-auto mt-4 text-center">
        Loading question...
      </div>
    );
  }

  // ───────────────────────── RENDER ─────────────────────────
  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto mt-4">
      <QuestionHeader
        state={headerState}
        formattedTime={formattedTime}
        currentQuestion={answeredCount}
        totalQuestions={totalQuestions}
        questionTimeLimit={questionTimeLimitMs / 1000}
      />
      <QuestionCard
        question={currentQuestion}
        onSelectAnswer={(option) => {
          // Only allow selection if not already submitting
          if (!isSubmitting) {
            handleSelectAnswer(option);
          }
        }}
        selectedOption={selectedOption}
        // Pass the transition's pending state to the card
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
