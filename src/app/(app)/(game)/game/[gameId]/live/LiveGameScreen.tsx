"use client";

/**
 * LiveGameScreen
 *
 * Main orchestrator for live game sessions.
 * Server-driven flow: questionIndex derived from server's answered count.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useTimer } from "@/hooks/useTimer";
import { useGameSocket } from "@/hooks/useGameSocket";
import { playSound } from "@/lib/sounds";
import { useGameStoreApi } from "@/components/providers/GameStoreProvider";
import { useGameEntry } from "@/hooks/useGameEntry";
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

    // Initialize WebSocket connection
    useGameSocket();

    // ==========================================
    // SERVER STATE (source of truth)
    // ==========================================
    const { entry, refetchEntry } = useGameEntry({ gameId: game.id });

    // Convert to Set for O(1) lookups
    const answeredIds = new Set(entry?.answeredQuestionIds ?? []);
    const serverScore = entry?.score ?? 0;

    // ==========================================
    // LOCAL UI STATE
    // ==========================================
    const [gameStarted, setGameStarted] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [timerTarget, setTimerTarget] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mediaReady, setMediaReady] = useState(false); // Track if current question's media is loaded

    // Tracks which question we're currently viewing (can differ from server during submission)
    const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);

    // ==========================================
    // DERIVED STATE
    // ==========================================

    // Find next unanswered question
    const nextUnansweredQuestion = game.questions.find(q => !answeredIds.has(q.id));

    // Current question: either explicitly set, or next unanswered
    const currentQuestion = currentQuestionId
        ? game.questions.find(q => q.id === currentQuestionId)
        : nextUnansweredQuestion;

    // Calculate current question index for display
    const currentQuestionIndex = currentQuestion
        ? game.questions.findIndex(q => q.id === currentQuestion.id)
        : -1;

    // Game complete conditions
    const isGameEnded = Date.now() >= game.endsAt.getTime();
    const allQuestionsAnswered = !nextUnansweredQuestion;
    const isGameComplete = isGameEnded || allQuestionsAnswered;

    // Has current question been answered?
    const hasAnsweredCurrent = currentQuestion ? answeredIds.has(currentQuestion.id) : false;

    // ==========================================
    // GAME LOGIC
    // ==========================================

    // Move to next unanswered question
    const advance = useCallback(() => {
        // Game complete check
        if (isGameComplete) {
            return;
        }

        // Find current position in questions array
        if (currentQuestionIndex === -1) return;

        const nextIdx = currentQuestionIndex + 1;

        // All questions done?
        if (nextIdx >= game.questions.length) {
            setCurrentQuestionId(null); // Will trigger isGameComplete
            return;
        }

        const current = game.questions[currentQuestionIndex];
        const next = game.questions[nextIdx];

        // Round break?
        if (!isBreak && current && next && current.roundIndex !== next.roundIndex) {
            setIsBreak(true);
            setTimerTarget(Date.now() + game.roundBreakSec * 1000);
            return;
        }

        // Move to next question (timer starts when media loads via handleMediaReady)
        setIsBreak(false);
        setCurrentQuestionId(next.id);
    }, [game.questions, game.roundBreakSec, currentQuestionIndex, isBreak, isGameComplete]);

    // Handle timer expiry
    const handleTimerExpiry = useCallback(async () => {
        if (isBreak) {
            advance();
            return;
        }

        // Auto-submit timeout if not answered
        if (!hasAnsweredCurrent && !isSubmitting && currentQuestion) {
            setIsSubmitting(true);
            const timeMs = currentQuestion.durationSec * 1000;
            await submitAnswerToServer(game.id, currentQuestion.id, -1, timeMs);
            await refetchEntry(); // Sync server state
            setIsSubmitting(false);
        }
        advance();
    }, [game.id, currentQuestion, isBreak, hasAnsweredCurrent, isSubmitting, refetchEntry, advance]);

    // Submit answer
    const submitAnswer = useCallback(
        async (selectedIndex: number) => {
            if (!currentQuestion || hasAnsweredCurrent || isSubmitting) return;

            setIsSubmitting(true);
            const timeMs = Date.now() - questionStartRef.current;

            // Add event to store for feed
            store.getState().addEvent({
                id: `local-${currentQuestion.id}-${Date.now()}`,
                type: "answer",
                username: "You",
                pfpUrl: userPfpUrl,
                content: "answered a question",
                timestamp: Date.now(),
            });

            // Submit to server
            await submitAnswerToServer(game.id, currentQuestion.id, selectedIndex, timeMs);

            // Refetch to get updated score/answered from server
            await refetchEntry();

            setIsSubmitting(false);
            advance();
        },
        [game.id, currentQuestion, hasAnsweredCurrent, isSubmitting, userPfpUrl, store, refetchEntry, advance]
    );

    // Start game - timer will start when media is ready
    const startGame = useCallback(() => {
        if (gameStarted) return;
        setGameStarted(true);
        // Set to first unanswered question (timer starts when media loads via handleMediaReady)
        if (nextUnansweredQuestion) {
            setCurrentQuestionId(nextUnansweredQuestion.id);
        }
    }, [gameStarted, nextUnansweredQuestion]);

    // Timer
    const seconds = useTimer(timerTarget, handleTimerExpiry);
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
    }, [currentQuestionId, store]);

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
                score={serverScore}
                gameTheme={game.theme}
                gameId={game.id}
            />
        );
    }

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
        const nextQuestion = game.questions[currentQuestionIndex + 1] ?? game.questions[0];
        return (
            <>
                <div className="flex-1 flex flex-col min-h-0">
                    <BreakView seconds={seconds} nextRoundNumber={nextQuestion?.roundIndex ?? 1} gameId={game.id} />
                </div>
                <CheerOverlay />
            </>
        );
    }

    // Callback when media is ready - start timer
    const handleMediaReady = useCallback(() => {
        if (!mediaReady && currentQuestion) {
            setMediaReady(true);
            // Start timer only after media is loaded
            questionStartRef.current = Date.now();
            setTimerTarget(Date.now() + (currentQuestion.durationSec ?? 10) * 1000);
        }
    }, [mediaReady, currentQuestion]);

    // Reset mediaReady when question changes
    useEffect(() => {
        setMediaReady(false);
    }, [currentQuestionId]);

    // Question view
    return (
        <>
            <QuestionView
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={game.questions.length}
                seconds={mediaReady ? seconds : currentQuestion.durationSec}
                onAnswer={submitAnswer}
                hasAnswered={hasAnsweredCurrent || isSubmitting}
                onMediaReady={handleMediaReady}
            />
            <CheerOverlay />
        </>
    );
}

// ==========================================
// API - Submit answer to server
// ==========================================

interface SubmitResult {
    success: boolean;
    pointsEarned: number;
}

async function submitAnswerToServer(
    gameId: number,
    questionId: number,
    selectedIndex: number,
    timeMs: number,
    retries = 3
): Promise<SubmitResult> {
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
            console.error(`Answer submit failed (attempt ${i + 1}):`, e);
        }
        if (i < retries - 1) {
            await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
        }
    }
    return { success: false, pointsEarned: 0 };
}
