"use client";

import { useLiveGame } from "./LiveGameProvider";
import { useTimer } from "@/hooks/useTimer";
import QuestionView from "./_components/QuestionView";
import BreakView from "./_components/BreakView";

/**
 * LiveGameScreen - Main orchestrator
 * 
 * Routes to QuestionView or BreakView based on state.
 * Handles timer completion callbacks.
 */
export default function LiveGameScreen() {
    const { isBreak, timerTarget, questionIndex, questions, advance } = useLiveGame();

    // Timer - calls advance when complete
    const seconds = useTimer(timerTarget, advance);

    // Get current question
    const currentQuestion = questions[questionIndex];

    if (!currentQuestion) {
        // Should not happen - game would have redirected
        return null;
    }

    if (isBreak) {
        const nextQuestion = questions[questionIndex + 1] ?? questions[0];
        return (
            <div className="flex-1 flex flex-col min-h-0">
                <BreakView
                    seconds={seconds}
                    nextRoundNumber={nextQuestion?.roundIndex ?? 1}
                />
            </div>
        );
    }

    return (
        <QuestionView
            question={currentQuestion}
            questionNumber={questionIndex + 1}
            totalQuestions={questions.length}
            seconds={seconds}
        />
    );
}
