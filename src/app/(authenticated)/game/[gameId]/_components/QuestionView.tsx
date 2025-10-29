// ───────────────────────── QuestionView.tsx ─────────────────────────
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useTimer } from "@/hooks/useTimer";
import SoundManager from "@/lib/SoundManager";
import { notify } from "@/components/ui/Toaster";
import { HydratedGame, HydratedUser } from "@/state/types";
import { submitAnswerAction } from "@/actions/game";
import QuestionCard from "./QuestionCard";
import { QuestionHeader } from "./QuestionCardHeader";
import { isSnapshot } from "@/lib/utils";
import RoundCountdownView from "./RoundCountdownView";
import { useUserPreferences } from "@/hooks/useUserPreferences";

// ───────────────────────── CONSTANTS ─────────────────────────
const NEXT_QUESTION_DELAY_SECONDS = 3;

// ───────────────────────── TYPES ─────────────────────────
type Phase = "QUESTION" | "GAP" | "ROUND";

// ───────────────────────── COMPONENT ─────────────────────────
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
  const roundTimeLimitMs = (game?.config?.roundTimeLimit ?? 15) * 1000; // ensure ms

  // Track current phase (single source of truth for which timer runs)
  const [phase, setPhase] = React.useState<Phase>("QUESTION");

  // Stamp when the question actually starts (for timeTaken)
  const questionStartTimeRef = React.useRef<number | null>(null);

  // compute answered/unanswered
  const answeredIds = new Set(
    userInfo?.answers?.map((a) => a.questionId) ?? []
  );
  const unansweredQuestions =
    game?.questions?.filter((q) => !answeredIds.has(q.id)) ?? [];

  const totalQuestions = game?.questions?.length ?? 0;
  const answeredCount = totalQuestions - unansweredQuestions.length;

  // If no more questions, go to score
  React.useEffect(() => {
    if (unansweredQuestions.length === 0) {
      router.push(`/game/${game?.id}/score`);
    }
  }, [unansweredQuestions.length, game?.id, router]);

  // ───────────────────────── TIMERS (do not autoStart here) ─────────────────────────
  const roundTimer = useTimer({
    duration: roundTimeLimitMs,
    autoStart: false,
    onComplete: () => {
      // Round snapshot ends → back to QUESTION phase
      setPhase("QUESTION");
    },
  });

  const questionGapTimer = useTimer({
    duration: nextQuestionDelayMs,
    autoStart: false,
    onComplete: () => {
      // After small gap, resume QUESTION phase
      setPhase("QUESTION");
    },
  });

  const questionTimer = useTimer({
    duration: questionTimeLimitMs,
    autoStart: false, // phase controls starting
    onComplete: () => {
      // Lock in and move to GAP phase
      setPhase("GAP");
    },
  });

  // ───────────────────────── PHASE ORCHESTRATION ─────────────────────────
  // Ensure only the active phase’s timer is running; others are stopped.
  React.useEffect(() => {
    // stop & reset non-active timers to avoid overlaps
    roundTimer.pause();
    roundTimer.reset();
    questionGapTimer.pause();
    questionGapTimer.reset();
    questionTimer.pause(); // keep elapsed, we'll reset on QUESTION branch

    if (phase === "ROUND") {
      roundTimer.start();
    } else if (phase === "GAP") {
      questionGapTimer.start();
    } else {
      // QUESTION phase
      questionTimer.reset();
      questionTimer.start();
      questionStartTimeRef.current = Date.now();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Switch into/out of ROUND based on your snapshot rule
  const inRoundBreak = isSnapshot(answeredCount, totalQuestions);
  React.useEffect(() => {
    setPhase(inRoundBreak ? "ROUND" : "QUESTION");
  }, [inRoundBreak]);

  // ───────────────────────── ANSWER SUBMISSION ─────────────────────────
  const handleAnswerClick = React.useCallback(
    async (option: string, questionId: number) => {
      if (!game || !questionId) return;

      if (prefs.soundEnabled) SoundManager.play("click");

      if (!userInfo.fid) {
        notify.error("Cannot submit answer: User not identified.");
        return;
      }

      // Calculate time taken in seconds
      const now = Date.now();
      const timeTakenSeconds =
        questionStartTimeRef.current != null
          ? (now - questionStartTimeRef.current) / 1000
          : 0;

      const result = await submitAnswerAction({
        fid: userInfo.fid,
        gameId: game.id,
        questionId,
        selected: option,
        timeTaken: timeTakenSeconds,
      });

      router.refresh();

      if (!result.success) {
        notify.error("Submission failed:");
      }
    },
    [userInfo.fid, game, prefs.soundEnabled, router]
  );

  // When GAP starts, if current question is still unanswered, submit "no answer" once.
  React.useEffect(() => {
    if (phase !== "GAP") return;
    const q = unansweredQuestions[0];
    if (!q) return;
    // If still unanswered at GAP entry, auto-submit
    if (!answeredIds.has(q.id)) {
      void handleAnswerClick("no answer", q.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ───────────────────────── RENDER ─────────────────────────
  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto mt-4">
      {phase === "ROUND" ? (
        <RoundCountdownView
          gameId={game.id}
          fid={userInfo.fid}
          roundTimer={roundTimer}
        />
      ) : (
        <>
          <QuestionHeader
            currentQuestion={answeredCount}
            totalQuestions={totalQuestions}
            questionTimer={questionTimer}
            questionGapTimer={questionGapTimer}
            questionTimeLimit={game?.config?.questionTimeLimit ?? 10}
          />
          <QuestionCard
            question={unansweredQuestions[0]}
            handleAnswerClick={handleAnswerClick}
          />
        </>
      )}
    </div>
  );
}
