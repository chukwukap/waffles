"use client";

/**
 * LiveGameProvider
 *
 * Minimal Context for live game session props from server.
 * Uses Zustand store for all mutable state (answers, timer, etc.)
 *
 * Best practice: Context for static props, Zustand for dynamic state.
 */

import {
    createContext,
    useContext,
    useCallback,
    useMemo,
    useRef,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useGameStoreApi, useGameStore } from "@/components/providers/GameStoreProvider";
import {
    selectAnswers,
    selectQuestionIndex,
    selectIsBreak,
    selectTimerTarget,
    selectGameStarted,
    selectIsGameComplete,
} from "@/lib/game-store";
import type { LiveGameData, LiveGameQuestion } from "./page";

// ==========================================
// CONTEXT TYPES (static props only)
// ==========================================

interface LiveGameContextValue {
    // Static game data from server
    gameId: number;
    questions: LiveGameQuestion[];
    roundBreakSec: number;
    prizePool: number;
    gameTheme: string;
    recentPlayers: { pfpUrl: string | null; username: string }[];

    // Actions
    submitAnswer: (selectedIndex: number) => void;
    advance: () => void;
    startGame: () => void;
}

const LiveGameContext = createContext<LiveGameContextValue | null>(null);

// ==========================================
// HOOK (for static props)
// ==========================================

export function useLiveGame(): LiveGameContextValue {
    const ctx = useContext(LiveGameContext);
    if (!ctx) {
        throw new Error("useLiveGame must be used within LiveGameProvider");
    }
    return ctx;
}

// ==========================================
// HOOKS FOR DYNAMIC STATE (from Zustand)
// ==========================================

export function useLiveGameState() {
    const questionIndex = useGameStore(selectQuestionIndex);
    const isBreak = useGameStore(selectIsBreak);
    const timerTarget = useGameStore(selectTimerTarget);
    const gameStarted = useGameStore(selectGameStarted);
    const isGameComplete = useGameStore(selectIsGameComplete);
    const answers = useGameStore(selectAnswers);

    return {
        questionIndex,
        isBreak,
        timerTarget,
        gameStarted,
        isGameComplete,
        answers,
        hasAnswered: useCallback((questionId: number) => answers.has(questionId), [answers]),
        getAnswer: useCallback((questionId: number) => answers.get(questionId), [answers]),
    };
}

// ==========================================
// PROVIDER
// ==========================================

interface LiveGameProviderProps {
    game: LiveGameData;
    children: ReactNode;
}

export function LiveGameProvider({ game, children }: LiveGameProviderProps) {
    const router = useRouter();
    const { context } = useMiniKit();
    const userPfpUrl = context?.user?.pfpUrl || null;

    // Get store API for imperative access
    const store = useGameStoreApi();

    // Verification state (local - only used during mount)
    const [verificationState, setVerificationState] = useState<
        "loading" | "valid" | "no-ticket" | "already-played" | "error"
    >("loading");

    // Refs for stable callbacks
    const questionStartRef = useRef(Date.now());
    const advanceRef = useRef<() => void>(() => { });

    // Initialize store with game questions on mount
    useEffect(() => {
        const state = store.getState();
        state.setQuestions(game.questions, game.roundBreakSec);
        state.resetLiveSession();

        return () => {
            store.getState().resetLiveSession();
        };
    }, [game.questions, game.roundBreakSec, store]);

    // Verify ticket and check for replay on mount
    useEffect(() => {
        async function verifyAccess() {
            try {
                const res = await sdk.quickAuth.fetch(`/api/v1/games/${game.id}/entry`);
                if (res.ok) {
                    const entry = await res.json();
                    const totalQuestions = game.questions.length;
                    const hasAnsweredAll = entry.answered >= totalQuestions;
                    const gameHasEnded = new Date() >= new Date(game.endsAt);

                    if (hasAnsweredAll || gameHasEnded) {
                        store.getState().setGameComplete(true);
                        setVerificationState("valid");
                    } else {
                        setVerificationState("valid");
                    }
                } else if (res.status === 404) {
                    setVerificationState("no-ticket");
                } else {
                    setVerificationState("error");
                }
            } catch (e) {
                console.error("Access verification failed:", e);
                setVerificationState("error");
            }
        }
        verifyAccess();
    }, [game.id, game.questions.length, game.endsAt, store]);

    // Redirect based on verification state
    useEffect(() => {
        if (verificationState === "no-ticket") {
            router.replace(`/game/${game.id}/ticket`);
        } else if (verificationState === "already-played") {
            router.replace(`/game/${game.id}/result`);
        }
    }, [verificationState, game.id, router]);

    // Submit answer action
    const submitAnswer = useCallback(
        (selectedIndex: number) => {
            const state = store.getState();
            const currentQuestion = game.questions[state.questionIndex];
            if (!currentQuestion) return;

            const timeMs = Date.now() - questionStartRef.current;
            const questionId = currentQuestion.id;

            // Check if already answered
            if (state.answers.has(questionId)) return;

            // Record in store
            state.submitAnswer(questionId, selectedIndex, timeMs);

            // Add optimistic event to feed
            state.addEvent({
                id: `local-${questionId}-${Date.now()}`,
                type: "answer",
                username: "You",
                pfpUrl: userPfpUrl,
                content: "answered a question",
                timestamp: Date.now(),
            });

            // Sync to server immediately
            syncAnswer(game.id, questionId, selectedIndex, timeMs).then((result) => {
                if (result.success) {
                    store.getState().updateScore(result.pointsEarned);
                }
            });

            // Advance immediately
            advanceRef.current();
        },
        [game.id, game.questions, userPfpUrl, store]
    );

    // Advance to next question or break
    const advance = useCallback(() => {
        const state = store.getState();
        const currentQ = game.questions[state.questionIndex];

        // If current question wasn't answered, submit timeout answer
        if (currentQ && !state.answers.has(currentQ.id)) {
            const timeMs = currentQ.durationSec * 1000;
            state.submitAnswer(currentQ.id, -1, timeMs);
            syncAnswer(game.id, currentQ.id, -1, timeMs);
        }

        const nextIndex = state.questionIndex + 1;

        // Game complete?
        if (nextIndex >= game.questions.length) {
            state.setGameComplete(true);
            return;
        }

        // Need break between rounds?
        const current = game.questions[state.questionIndex];
        const next = game.questions[nextIndex];
        if (!state.isBreak && current && next && current.roundIndex !== next.roundIndex) {
            state.setIsBreak(true);
            state.setTimerTarget(Date.now() + game.roundBreakSec * 1000);
            return;
        }

        // Move to next question
        state.setIsBreak(false);
        state.setQuestionIndex(nextIndex);
        questionStartRef.current = Date.now();
        state.setTimerTarget(Date.now() + (next?.durationSec ?? 10) * 1000);
    }, [game.id, game.questions, game.roundBreakSec, store]);

    // Keep ref in sync
    advanceRef.current = advance;

    // Start the game
    const startGame = useCallback(() => {
        const state = store.getState();
        if (state.gameStarted) return;

        state.setGameStarted(true);
        questionStartRef.current = Date.now();
        const firstQ = game.questions[0];
        state.setTimerTarget(Date.now() + (firstQ?.durationSec ?? 10) * 1000);
    }, [game.questions, store]);

    // Context value (static props + actions only)
    const value = useMemo<LiveGameContextValue>(
        () => ({
            gameId: game.id,
            questions: game.questions,
            roundBreakSec: game.roundBreakSec,
            prizePool: game.prizePool,
            gameTheme: game.theme,
            recentPlayers: game.recentPlayers,
            submitAnswer,
            advance,
            startGame,
        }),
        [game, submitAnswer, advance, startGame]
    );

    // Verification UI states
    if (verificationState === "loading") {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-full bg-[#0E0E0E]">
                <div className="text-white text-lg animate-pulse">Verifying access...</div>
            </div>
        );
    }

    if (verificationState === "no-ticket") {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-full bg-[#0E0E0E]">
                <div className="text-white text-lg">No ticket found. Redirecting...</div>
            </div>
        );
    }

    if (verificationState === "already-played") {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-full bg-[#0E0E0E]">
                <div className="text-white text-lg">You've already played. Redirecting to results...</div>
            </div>
        );
    }

    if (verificationState === "error") {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-full bg-[#0E0E0E]">
                <div className="text-white text-lg">Failed to verify access. Please try again.</div>
            </div>
        );
    }

    return (
        <LiveGameContext.Provider value={value}>
            {children}
        </LiveGameContext.Provider>
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
