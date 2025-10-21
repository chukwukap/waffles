"use client";

import { useMemo } from "react";
import { useGameStore } from "@/stores/gameStore";

function mmss(total: number) {
  const m = Math.max(0, Math.floor(total / 60));
  const s = Math.max(0, total % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Top strip used inside QuestionView:
 *  - Left: Q index (01/20)
 *  - Right: two timers (round & question)
 *  - Row 2: Centered title (e.g., "WHO IS THIS?")
 */
export default function QuestionTop() {
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const totalQuestions = useGameStore((s) => s.totalQuestions);
  const roundTimer = useGameStore((s) => s.roundTimer);
  const questionTimer = useGameStore((s) => s.questionTimer);
  const currentQuestion = useGameStore((s) => s.currentQuestion);

  const qCount = useMemo(() => {
    const now = Math.max(0, currentQuestionIndex + 1);
    return `${String(now).padStart(2, "0")}/${String(totalQuestions).padStart(
      2,
      "0"
    )}`;
  }, [currentQuestionIndex, totalQuestions]);

  const tRound = useMemo(() => mmss(roundTimer), [roundTimer]);
  const tQuestion = useMemo(() => mmss(questionTimer), [questionTimer]);

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto mt-14">
      {/* Row 1: counters */}
      <div className="flex items-center justify-between px-2 xs:px-3 sm:px-4 py-1.5">
        <span className="font-edit-undo text-white text-sm sm:text-base leading-[0.92] tracking-tight">
          {qCount}
        </span>

        <div className="flex items-center gap-3 sm:gap-4">
          <span
            aria-label="Round timer"
            className="font-edit-undo text-white text-sm sm:text-base leading-[0.92] tracking-tight"
          >
            {tRound}
          </span>
          <span
            aria-label="Question timer"
            className="font-edit-undo text-white text-sm sm:text-base leading-[0.92] tracking-tight"
          >
            {tQuestion}
          </span>
        </div>
      </div>

      {/* Row 2: title */}
      <div className="flex flex-col items-center gap-0.5">
        <h1 className="font-edit-undo text-white text-3xl sm:text-4xl md:text-5xl leading-[0.92] tracking-tight text-center">
          {currentQuestion?.questionText ?? "—"}
        </h1>
      </div>
    </div>
  );
}
