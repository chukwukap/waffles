"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveGame } from "./LiveGameProvider";
import { useTimer } from "@/hooks/useTimer";
import { playSound } from "@/lib/sounds";
import QuestionView from "./_components/QuestionView";
import BreakView from "./_components/BreakView";
import GameCountdownScreen from "./_components/GameCountdownScreen";
import GameCompleteScreen from "./_components/GameCompleteScreen";
import { CheerOverlay } from "../../_components/CheerOverlay";
import { useGameStore, selectScore } from "@/lib/game-store";

/**
 * LiveGameScreen - Main orchestrator
 */
export default function LiveGameScreen() {
    const [showCountdown, setShowCountdown] = useState(true);

    if (showCountdown) {
        return <GameCountdownScreen onComplete={() => setShowCountdown(false)} />;
    }

    return <LiveGameContent />;
}

/**
 * LiveGameContent - Actual game logic
 */
function LiveGameContent() {
    const {
        isBreak,
        timerTarget,
        questionIndex,
        questions,
        advance,
        isGameComplete,
        gameId,
        gameTheme,
    } = useLiveGame();

    // Get score from global store (synced during gameplay)
    const score = useGameStore(selectScore);

    const seconds = useTimer(timerTarget, advance);
    const prevSeconds = useRef(seconds);

    // Play timer sounds
    useEffect(() => {
        if (!isBreak && prevSeconds.current > 3 && seconds === 3) {
            playSound("timerFinal");
        }
        if (prevSeconds.current > 0 && seconds === 0) {
            playSound("timeUp");
        }
        prevSeconds.current = seconds;
    }, [seconds, isBreak]);

    // Show game complete screen when finished
    if (isGameComplete) {
        return (
            <GameCompleteScreen
                score={score}
                gameTheme={gameTheme}
                gameId={gameId}
            />
        );
    }

    const currentQuestion = questions[questionIndex];
    if (!currentQuestion) return null;

    if (isBreak) {
        const nextQuestion = questions[questionIndex + 1] ?? questions[0];
        return (
            <>
                <div className="flex-1 flex flex-col min-h-0">
                    <BreakView seconds={seconds} nextRoundNumber={nextQuestion?.roundIndex ?? 1} />
                </div>
                <CheerOverlay />
            </>
        );
    }

    return (
        <>
            <QuestionView
                question={currentQuestion}
                questionNumber={questionIndex + 1}
                totalQuestions={questions.length}
                seconds={seconds}
            />
            <CheerOverlay />
        </>
    );
}
