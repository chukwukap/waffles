"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
    const { startGame, recentPlayers } = useLiveGame();

    const handleCountdownComplete = useCallback(() => {
        startGame(); // Start the timer
        setShowCountdown(false); // Show the game content
    }, [startGame]);

    if (showCountdown) {
        return <GameCountdownScreen onComplete={handleCountdownComplete} recentPlayers={recentPlayers} />;
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

    // No questions available - show error state instead of blank
    if (!currentQuestion) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <p className="font-body text-2xl text-white mb-2">NO QUESTIONS LOADED</p>
                <p className="font-display text-sm text-white/50">
                    The game has no questions or they failed to load.
                </p>
            </div>
        );
    }

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
