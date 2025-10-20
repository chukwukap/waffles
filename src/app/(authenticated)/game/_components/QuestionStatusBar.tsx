// /components/game/QuestionStatusBar.tsx
"use client";

import { useGameStore } from "@/stores/gameStore";

const QuestionStatusBar = () => {
  const { questionTimer, currentQuestionIndex, totalQuestions } = useGameStore(
    (state) => ({
      questionTimer: state.questionTimer,
      currentQuestionIndex: state.currentQuestionIndex,
      totalQuestions: state.totalQuestions,
    })
  );

  const initialTime = 10;
  const progressPercentage = (questionTimer / initialTime) * 100;

  return (
    <div className="w-full flex justify-between items-center px-2.5 h-[25px]">
      <span className="font-edit-undo text-lg text-white">
        {String(currentQuestionIndex + 1).padStart(2, "0")}/{totalQuestions}
      </span>
      <div className="flex items-center gap-3">
        <span className="font-edit-undo text-lg text-white">
          00:{String(questionTimer).padStart(2, "0")}
        </span>
        <div className="w-[78px] h-[12px] bg- flex items-center p-0.5">
          <div
            className="h-full bg-"
            style={{
              width: `${progressPercentage}%`,
              transition: "width 1s linear",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default QuestionStatusBar;
