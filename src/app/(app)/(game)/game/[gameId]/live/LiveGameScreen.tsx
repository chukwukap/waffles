"use client";

/**
 * LiveGameScreen
 *
 * Main orchestrator for live game sessions.
 * Uses Zustand store via provider-based hooks.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useLiveGame, useLiveGameState } from "./LiveGameProvider";
import { useTimer } from "@/hooks/useTimer";
import { playSound } from "@/lib/sounds";
import { useGameStore } from "@/components/providers/GameStoreProvider";
import { selectScore } from "@/lib/game-store";
import QuestionView from "./_components/QuestionView";
import BreakView from "./_components/BreakView";
import GameCountdownScreen from "./_components/GameCountdownScreen";
import GameCompleteScreen from "./_components/GameCompleteScreen";
import { CheerOverlay } from "../../_components/CheerOverlay";

/**
 * LiveGameScreen - Main entry point
 */
export default function LiveGameScreen() {
    const [showCountdown, setShowCountdown] = useState(true);
    const { startGame, recentPlayers } = useLiveGame();

    const handleCountdownComplete = useCallback(() => {
        startGame();
        setShowCountdown(false);
    }, [startGame]);

    if (showCountdown) {
        return (
            <GameCountdownScreen
                onComplete={handleCountdownComplete}
                recentPlayers={recentPlayers}
            />
        );
    }

    return <LiveGameContent />;
}

/**
 * LiveGameContent - Game logic with Zustand state
 */
function LiveGameContent() {
    // Static props from context
    const { questions, advance, gameId, gameTheme } = useLiveGame();

    // Dynamic state from Zustand store via provider
    const { questionIndex, isBreak, timerTarget, isGameComplete } = useLiveGameState();

    // Score from store
    const score = useGameStore(selectScore);

    // Timer with advance callback
    const seconds = useTimer(timerTarget, advance);
    const prevSecondsRef = useRef(seconds);

    // Timer sound effects
    useEffect(() => {
        if (!isBreak && prevSecondsRef.current > 3 && seconds === 3) {
            playSound("timerFinal");
        }
        if (prevSecondsRef.current > 0 && seconds === 0) {
            playSound("timeUp");
        }
        prevSecondsRef.current = seconds;
    }, [seconds, isBreak]);

    // Game complete
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

    // Error state
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

    // Break between rounds
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

    // Question view
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
