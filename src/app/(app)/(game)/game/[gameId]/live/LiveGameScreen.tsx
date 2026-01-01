"use client";

/**
 * LiveGameScreen
 *
 * Main orchestrator for live game sessions.
 * Uses local React state for session + Zustand for score/events only.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useTimer } from "@/hooks/useTimer";
import { useGameSocket } from "@/hooks/useGameSocket";
import { playSound } from "@/lib/sounds";
import { useGameStore, useGameStoreApi } from "@/components/providers/GameStoreProvider";
import { selectScore } from "@/lib/game-store";
import QuestionView from "./_components/QuestionView";
import BreakView from "./_components/BreakView";
import GameCountdownScreen from "./_components/GameCountdownScreen";
import GameCompleteScreen from "./_components/GameCompleteScreen";
import { CheerOverlay } from "../../_components/CheerOverlay";
import type { LiveGameData } from "./page";

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function LiveGameScreen({ game }: { game: LiveGameData }) {
    const { context } = useMiniKit();
    const userPfpUrl = context?.user?.pfpUrl || null;
    const store = useGameStoreApi();
    const questionStartRef = useRef(Date.now());

    // Initialize WebSocket connection (gets gameId from URL params)
    useGameSocket();

    // ==========================================
    // LOCAL SESSION STATE (not in store)
    // ==========================================
    const [gameStarted, setGameStarted] = useState(false);
    const [isGameComplete, setIsGameComplete] = useState(false);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [isBreak, setIsBreak] = useState(false);
    const [timerTarget, setTimerTarget] = useState(0);
    const [answers, setAnswers] = useState<Map<number, { selected: number; timeMs: number }>>(new Map());

    // Score still from store (updated via API sync)
    const score = useGameStore(selectScore);

    // ==========================================
    // GAME LOGIC
    // ==========================================

    // Advance to next question
    const advance = useCallback(() => {
        const currentQ = game.questions[questionIndex];

        // Timeout answer if not answered
        if (currentQ && !answers.has(currentQ.id)) {
            const timeMs = currentQ.durationSec * 1000;
            setAnswers((prev) => new Map(prev).set(currentQ.id, { selected: -1, timeMs }));
            syncAnswer(game.id, currentQ.id, -1, timeMs);
        }

        const nextIndex = questionIndex + 1;

        // Game complete?
        if (nextIndex >= game.questions.length) {
            setIsGameComplete(true);
            return;
        }

        const current = game.questions[questionIndex];
        const next = game.questions[nextIndex];

        // Round break?
        if (!isBreak && current && next && current.roundIndex !== next.roundIndex) {
            setIsBreak(true);
            setTimerTarget(Date.now() + game.roundBreakSec * 1000);
            return;
        }

        // Move to next question
        setIsBreak(false);
        setQuestionIndex(nextIndex);
        questionStartRef.current = Date.now();
        setTimerTarget(Date.now() + (next?.durationSec ?? 10) * 1000);
    }, [game.id, game.questions, game.roundBreakSec, questionIndex, isBreak, answers]);

    // Submit answer
    const submitAnswer = useCallback(
        (selectedIndex: number) => {
            const currentQuestion = game.questions[questionIndex];
            if (!currentQuestion || answers.has(currentQuestion.id)) return;

            const timeMs = Date.now() - questionStartRef.current;
            setAnswers((prev) => new Map(prev).set(currentQuestion.id, { selected: selectedIndex, timeMs }));

            // Add event to store for feed
            store.getState().addEvent({
                id: `local-${currentQuestion.id}-${Date.now()}`,
                type: "answer",
                username: "You",
                pfpUrl: userPfpUrl,
                content: "answered a question",
                timestamp: Date.now(),
            });

            // Sync and update score
            syncAnswer(game.id, currentQuestion.id, selectedIndex, timeMs).then((result) => {
                if (result.success) {
                    store.getState().updateScore(result.pointsEarned);
                }
            });

            advance();
        },
        [game.id, game.questions, questionIndex, answers, userPfpUrl, store, advance]
    );

    // Start game
    const startGame = useCallback(() => {
        if (gameStarted) return;
        setGameStarted(true);
        questionStartRef.current = Date.now();
        const firstQ = game.questions[0];
        setTimerTarget(Date.now() + (firstQ?.durationSec ?? 10) * 1000);
    }, [gameStarted, game.questions]);

    // Timer
    const seconds = useTimer(timerTarget, advance);
    const prevSecondsRef = useRef(seconds);

    // Sound effects
    useEffect(() => {
        if (!isBreak && prevSecondsRef.current > 3 && seconds === 3) {
            playSound("timerFinal");
        }
        if (prevSecondsRef.current > 0 && seconds === 0) {
            playSound("timeUp");
        }
        prevSecondsRef.current = seconds;
    }, [seconds, isBreak]);

    // Clear answerers when question changes
    useEffect(() => {
        store.getState().clearAnswerers();
    }, [questionIndex, store]);

    // ==========================================
    // RENDER
    // ==========================================

    // Pre-game countdown
    if (!gameStarted) {
        return (
            <GameCountdownScreen
                onComplete={() => startGame()}
                recentPlayers={game.recentPlayers}
            />
        );
    }

    // Game complete
    if (isGameComplete) {
        return (
            <GameCompleteScreen
                score={score}
                gameTheme={game.theme}
                gameId={game.id}
            />
        );
    }

    const currentQuestion = game.questions[questionIndex];

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
        const nextQuestion = game.questions[questionIndex + 1] ?? game.questions[0];
        return (
            <>
                <div className="flex-1 flex flex-col min-h-0">
                    <BreakView seconds={seconds} nextRoundNumber={nextQuestion?.roundIndex ?? 1} gameId={game.id} />
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
                totalQuestions={game.questions.length}
                seconds={seconds}
                onAnswer={submitAnswer}
                hasAnswered={answers.has(currentQuestion.id)}
            />
            <CheerOverlay />
        </>
    );
}

// ==========================================
// API SYNC
// ==========================================

interface SyncResult {
    success: boolean;
    pointsEarned: number;
}

async function syncAnswer(
    gameId: number,
    questionId: number,
    selectedIndex: number,
    timeMs: number,
    retries = 3
): Promise<SyncResult> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await sdk.quickAuth.fetch(`/api/v1/games/${gameId}/answers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionId, selectedIndex, timeTakenMs: timeMs }),
            });
            if (res.ok) {
                const data = await res.json();
                return { success: true, pointsEarned: data.pointsEarned ?? 0 };
            }
        } catch (e) {
            console.error(`Answer sync failed (attempt ${i + 1}):`, e);
        }
        if (i < retries - 1) {
            await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
        }
    }
    return { success: false, pointsEarned: 0 };
}
