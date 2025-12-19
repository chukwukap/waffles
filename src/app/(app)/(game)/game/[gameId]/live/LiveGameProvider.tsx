"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    useRef,
    useEffect,
    type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/miniapp-sdk";
import { useGameStore } from "@/lib/game-store";
import type { LiveGameData, LiveGameQuestion } from "./page";

// ==========================================
// TYPES
// ==========================================

interface Answer {
    selected: number;
    timeMs: number;
    synced: boolean;
}

interface LiveGameContextValue {
    // Game data
    gameId: number;
    questions: LiveGameQuestion[];
    roundBreakSec: number;

    // Current state
    questionIndex: number;
    isBreak: boolean;
    timerTarget: number;

    // Answers
    answers: Map<number, Answer>;
    hasAnswered: (questionId: number) => boolean;
    getAnswer: (questionId: number) => Answer | undefined;

    // Actions
    submitAnswer: (selectedIndex: number) => void;
    advance: () => void;
}

const LiveGameContext = createContext<LiveGameContextValue | null>(null);

// ==========================================
// HOOK
// ==========================================

export function useLiveGame(): LiveGameContextValue {
    const ctx = useContext(LiveGameContext);
    if (!ctx) {
        throw new Error("useLiveGame must be used within LiveGameProvider");
    }
    return ctx;
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

    // Ticket and replay verification state
    const [verificationState, setVerificationState] = useState<
        "loading" | "valid" | "no-ticket" | "already-played" | "error"
    >("loading");

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

                    // Only redirect to result if:
                    // 1. User has answered ALL questions, OR
                    // 2. Game has ended (time's up)
                    if (hasAnsweredAll || gameHasEnded) {
                        setVerificationState("already-played");
                    } else {
                        // User can continue playing - either fresh start or resume
                        setVerificationState("valid");
                    }
                } else if (res.status === 404) {
                    // No entry found = no ticket
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
    }, [game.id, game.questions.length, game.endsAt]);

    // Redirect based on verification state
    useEffect(() => {
        if (verificationState === "no-ticket") {
            router.replace(`/game/${game.id}/ticket`);
        } else if (verificationState === "already-played") {
            router.replace(`/game/${game.id}/result`);
        }
    }, [verificationState, game.id, router]);

    // State
    const [questionIndex, setQuestionIndex] = useState(0);
    const [isBreak, setIsBreak] = useState(false);
    const [timerTarget, setTimerTarget] = useState(() => {
        // First question timer
        const firstQ = game.questions[0];
        return Date.now() + (firstQ?.durationSec) * 1000;
    });
    const [answers, setAnswers] = useState<Map<number, Answer>>(new Map());

    // Refs for stable callbacks
    const questionStartRef = useRef(Date.now());
    const advanceRef = useRef<() => void>(() => { });

    // Current question
    const currentQuestion = game.questions[questionIndex];

    // Check if we need a break (round change)
    const needsBreak = useCallback(
        (fromIndex: number): boolean => {
            const current = game.questions[fromIndex];
            const next = game.questions[fromIndex + 1];
            if (!current || !next) return false;
            return current.roundIndex !== next.roundIndex;
        },
        [game.questions]
    );

    // Submit answer and advance immediately
    const submitAnswer = useCallback(
        (selectedIndex: number) => {
            if (!currentQuestion) return;

            const timeMs = Date.now() - questionStartRef.current;
            const questionId = currentQuestion.id;

            // Check if already answered
            if (answers.has(questionId)) return;

            // Record locally
            const answer: Answer = { selected: selectedIndex, timeMs, synced: false };
            setAnswers((prev) => new Map(prev).set(questionId, answer));

            // Sync to server (fire and forget with retry)
            syncAnswer(game.id, questionId, selectedIndex, timeMs).then((result) => {
                if (result.success) {
                    setAnswers((prev) => {
                        const updated = new Map(prev);
                        const a = updated.get(questionId);
                        if (a) updated.set(questionId, { ...a, synced: true });
                        return updated;
                    });
                    // Update score in global store
                    useGameStore.getState().updateScore(result.pointsEarned);
                }
            });

            // Advance immediately - no delay
            advanceRef.current();
        },
        [currentQuestion, answers, game.id]
    );

    // Advance to next question or break
    const advance = useCallback(() => {
        const currentQ = game.questions[questionIndex];

        // If current question wasn't answered, submit timeout answer
        if (currentQ && !answers.has(currentQ.id)) {
            const timeMs = currentQ.durationSec * 1000; // Max time = timeout
            const answer: Answer = { selected: -1, timeMs, synced: false };
            setAnswers((prev) => new Map(prev).set(currentQ.id, answer));

            // Sync timeout to server (0 points for -1 selection)
            syncAnswer(game.id, currentQ.id, -1, timeMs);
        }

        const nextIndex = questionIndex + 1;

        // Game complete?
        if (nextIndex >= game.questions.length) {
            router.push(`/game/${game.id}/result`);
            return;
        }

        // Need break between rounds?
        if (!isBreak && needsBreak(questionIndex)) {
            setIsBreak(true);
            setTimerTarget(Date.now() + game.roundBreakSec * 1000);
            return;
        }

        // Move to next question
        setIsBreak(false);
        setQuestionIndex(nextIndex);
        questionStartRef.current = Date.now();
        const nextQ = game.questions[nextIndex];
        setTimerTarget(Date.now() + (nextQ?.durationSec ?? 10) * 1000);
    }, [questionIndex, isBreak, needsBreak, game, router, answers]);

    // Keep ref in sync for setTimeout callbacks
    advanceRef.current = advance;

    // Helper methods
    const hasAnswered = useCallback(
        (questionId: number) => answers.has(questionId),
        [answers]
    );

    const getAnswer = useCallback(
        (questionId: number) => answers.get(questionId),
        [answers]
    );

    // Context value
    const value = useMemo<LiveGameContextValue>(
        () => ({
            gameId: game.id,
            questions: game.questions,
            roundBreakSec: game.roundBreakSec,
            questionIndex,
            isBreak,
            timerTarget,
            answers,
            hasAnswered,
            getAnswer,
            submitAnswer,
            advance,
        }),
        [
            game,
            questionIndex,
            isBreak,
            timerTarget,
            answers,
            hasAnswered,
            getAnswer,
            submitAnswer,
            advance,
        ]
    );

    // Show loading while verifying access
    if (verificationState === "loading") {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-full bg-[#0E0E0E]">
                <div className="text-white text-lg animate-pulse">Verifying access...</div>
            </div>
        );
    }

    // Show message for redirect states
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
        // Exponential backoff
        if (i < retries - 1) {
            await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
        }
    }
    return { success: false, pointsEarned: 0 };
}
