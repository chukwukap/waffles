"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveGame } from "./LiveGameProvider";
import { useTimer } from "@/hooks/useTimer";
import { playSound } from "@/lib/sounds";
import QuestionView from "./_components/QuestionView";
import BreakView from "./_components/BreakView";
import GameCountdownScreen from "./_components/GameCountdownScreen";
import { CheerOverlay } from "../../_components/CheerOverlay";

/**
 * LiveGameScreen - Main orchestrator
 * 
 * Shows countdown video on first visit to live game, then routes to QuestionView or BreakView.
 */
export default function LiveGameScreen() {
    // Show countdown every time user enters the live game
    const [showCountdown, setShowCountdown] = useState(true);

    const handleCountdownComplete = () => {
        setShowCountdown(false);
    };

    // Show countdown screen before game
    if (showCountdown) {
        return <GameCountdownScreen onComplete={handleCountdownComplete} />;
    }

    return <LiveGameContent />;
}

/**
 * LiveGameContent - Actual game logic
 */
function LiveGameContent() {
    const { isBreak, timerTarget, questionIndex, questions, advance } = useLiveGame();

    // Timer - calls advance when complete
    const seconds = useTimer(timerTarget, advance);
    const prevSeconds = useRef(seconds);

    // Play timer sounds at key moments
    useEffect(() => {
        // Play final countdown sound when entering last 3 seconds (only during questions)
        if (!isBreak && prevSeconds.current > 3 && seconds === 3) {
            playSound("timerFinal");
        }
        // Play time up sound when timer hits 0
        if (prevSeconds.current > 0 && seconds === 0) {
            playSound("timeUp");
        }
        prevSeconds.current = seconds;
    }, [seconds, isBreak]);

    // Get current question
    const currentQuestion = questions[questionIndex];

    if (!currentQuestion) {
        // Should not happen - game would have redirected
        return null;
    }

    if (isBreak) {
        const nextQuestion = questions[questionIndex + 1] ?? questions[0];
        return (
            <>
                <div className="flex-1 flex flex-col min-h-0">
                    <BreakView
                        seconds={seconds}
                        nextRoundNumber={nextQuestion?.roundIndex ?? 1}
                    />
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
