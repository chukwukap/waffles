"use client";

/**
 * useLiveGame Hook
 *
 * Single source of truth for live game state.
 * Uses state machine pattern with clear phases:
 * COUNTDOWN → QUESTION → BREAK → QUESTION → ... → COMPLETE
 *
 * All hooks are called unconditionally at the top level.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useTimer } from "@/hooks/useTimer";
import { useGame } from "@/components/providers/GameProvider";
import { playSound } from "@/lib/sounds";
import type {
  LiveGameData,
  LiveGameQuestion,
} from "@/app/(app)/(game)/game/[gameId]/live/page";

// ==========================================
// TYPES
// ==========================================

export type GamePhase = "countdown" | "question" | "break" | "complete";

export interface UseLiveGameReturn {
  // Current phase
  phase: GamePhase;

  // Timer
  secondsRemaining: number;

  // Question state (only valid in 'question' phase)
  currentQuestion: LiveGameQuestion | null;
  questionNumber: number;
  totalQuestions: number;

  // Answer state
  hasAnswered: boolean;
  isSubmitting: boolean;
  score: number;

  // Break state
  nextRoundNumber: number;

  // Actions
  startGame: () => void;
  submitAnswer: (index: number) => Promise<void>;
  onMediaReady: () => void;
}

// ==========================================
// HOOK
// ==========================================

export function useLiveGame(game: LiveGameData): UseLiveGameReturn {
  const { context } = useMiniKit();
  const userPfpUrl = context?.user?.pfpUrl || null;
  const { dispatch } = useGame();

  // ==========================================
  // ALL HOOKS DECLARED UNCONDITIONALLY HERE
  // ==========================================

  // Local entry state (fetched separately since entry is per-game)
  const [entry, setEntry] = useState<{
    score: number;
    answered: number;
    answeredQuestionIds: string[];
  } | null>(null);

  // Fetch entry from server
  const refetchEntry = useCallback(async () => {
    try {
      const res = await sdk.quickAuth.fetch(`/api/v1/games/${game.id}/entry`);
      if (res.ok) {
        const data = await res.json();
        setEntry({
          score: data.score ?? 0,
          answered: data.answered ?? 0,
          answeredQuestionIds: data.answeredQuestionIds ?? [],
        });
      }
    } catch (err) {
      console.error("[useLiveGame] Failed to fetch entry:", err);
    }
  }, [game.id]);

  // Initial fetch
  useEffect(() => {
    refetchEntry();
  }, [refetchEntry]);

  // Core state
  const [phase, setPhase] = useState<GamePhase>("countdown");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timerTarget, setTimerTarget] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);

  // Refs
  const questionStartRef = useRef(Date.now());
  const prevSecondsRef = useRef(0);

  // ==========================================
  // DERIVED STATE (useMemo for stability)
  // ==========================================

  const answeredIds = useMemo(
    () => new Set(entry?.answeredQuestionIds ?? []),
    [entry?.answeredQuestionIds]
  );

  const score = entry?.score ?? 0;

  const currentQuestion = useMemo(
    () => game.questions[currentQuestionIndex] ?? null,
    [game.questions, currentQuestionIndex]
  );

  const hasAnswered = useMemo(
    () => (currentQuestion ? answeredIds.has(currentQuestion.id) : false),
    [currentQuestion, answeredIds]
  );

  const isGameEnded = Date.now() >= game.endsAt.getTime();

  const nextRoundNumber = useMemo(() => {
    const nextQ = game.questions[currentQuestionIndex + 1];
    return nextQ?.roundIndex ?? 1;
  }, [game.questions, currentQuestionIndex]);

  // ==========================================
  // TIMER EXPIRY HANDLER
  // ==========================================

  const handleTimerExpiry = useCallback(async () => {
    if (phase === "break") {
      // Move to next question after break
      const nextIdx = currentQuestionIndex + 1;
      if (nextIdx >= game.questions.length || isGameEnded) {
        setPhase("complete");
      } else {
        setCurrentQuestionIndex(nextIdx);
        setMediaReady(false);
        setPhase("question");
      }
      return;
    }

    if (phase === "question") {
      // Auto-submit timeout if not answered
      if (!hasAnswered && !isSubmitting && currentQuestion) {
        setIsSubmitting(true);
        const timeMs = currentQuestion.durationSec * 1000;
        await submitAnswerToServer(game.id, currentQuestion.id, -1, timeMs);
        await refetchEntry();
        setIsSubmitting(false);
      }

      // Move to next question or break
      advanceToNext();
    }
  }, [
    phase,
    currentQuestionIndex,
    game.questions.length,
    game.id,
    isGameEnded,
    hasAnswered,
    isSubmitting,
    currentQuestion,
    refetchEntry,
  ]);

  // ==========================================
  // TIMER
  // ==========================================

  const seconds = useTimer(timerTarget, handleTimerExpiry);

  // Sound effects
  useEffect(() => {
    if (phase !== "question") return;

    if (prevSecondsRef.current > 3 && seconds === 3) {
      playSound("timerFinal");
    }
    if (prevSecondsRef.current > 0 && seconds === 0) {
      playSound("timeUp");
    }
    prevSecondsRef.current = seconds;
  }, [seconds, phase]);

  // ==========================================
  // GAME LOGIC
  // ==========================================

  const advanceToNext = useCallback(() => {
    const nextIdx = currentQuestionIndex + 1;

    // Game complete?
    if (nextIdx >= game.questions.length || isGameEnded) {
      setPhase("complete");
      return;
    }

    const current = game.questions[currentQuestionIndex];
    const next = game.questions[nextIdx];

    // Round break?
    if (current && next && current.roundIndex !== next.roundIndex) {
      setPhase("break");
      setTimerTarget(Date.now() + game.roundBreakSec * 1000);
      return;
    }

    // Move to next question
    setCurrentQuestionIndex(nextIdx);
    setMediaReady(false);
    setPhase("question");
  }, [currentQuestionIndex, game.questions, game.roundBreakSec, isGameEnded]);

  // Set current question in context (for real-time answerer filtering)
  useEffect(() => {
    if (phase === "question" && game.questions[currentQuestionIndex]) {
      dispatch({
        type: "SET_CURRENT_QUESTION",
        payload: game.questions[currentQuestionIndex].id,
      });
    }
  }, [currentQuestionIndex, phase, dispatch, game.questions]);

  // ==========================================
  // ACTIONS
  // ==========================================

  const startGame = useCallback(() => {
    if (phase !== "countdown") return;

    // Find first unanswered question
    const firstUnansweredIdx = game.questions.findIndex(
      (q) => !answeredIds.has(q.id)
    );

    if (firstUnansweredIdx === -1) {
      // All questions answered
      setPhase("complete");
      return;
    }

    setCurrentQuestionIndex(firstUnansweredIdx);
    setMediaReady(false);
    setPhase("question");
  }, [phase, game.questions, answeredIds]);

  const submitAnswer = useCallback(
    async (selectedIndex: number) => {
      if (!currentQuestion || hasAnswered || isSubmitting) return;

      setIsSubmitting(true);
      const timeMs = Date.now() - questionStartRef.current;

      // Add event to context for feed
      dispatch({
        type: "ADD_EVENT",
        payload: {
          id: `local-${currentQuestion.id}-${Date.now()}`,
          type: "achievement" as const,
          username: "You",
          pfpUrl: userPfpUrl,
          content: "answered a question",
          timestamp: Date.now(),
        },
      });

      // Submit to server
      await submitAnswerToServer(
        game.id,
        currentQuestion.id,
        selectedIndex,
        timeMs
      );
      await refetchEntry();

      setIsSubmitting(false);
      advanceToNext();
    },
    [
      game.id,
      currentQuestion,
      hasAnswered,
      isSubmitting,
      userPfpUrl,
      dispatch,
      refetchEntry,
      advanceToNext,
    ]
  );

  const onMediaReady = useCallback(() => {
    if (!mediaReady && currentQuestion && phase === "question") {
      setMediaReady(true);
      questionStartRef.current = Date.now();
      setTimerTarget(Date.now() + currentQuestion.durationSec * 1000);
    }
  }, [mediaReady, currentQuestion, phase]);

  // ==========================================
  // RETURN
  // ==========================================

  return {
    phase,
    secondsRemaining: mediaReady ? seconds : currentQuestion?.durationSec ?? 0,
    currentQuestion,
    questionNumber: currentQuestionIndex + 1,
    totalQuestions: game.questions.length,
    hasAnswered,
    isSubmitting,
    score,
    nextRoundNumber,
    startGame,
    submitAnswer,
    onMediaReady,
  };
}

// ==========================================
// API HELPER
// ==========================================

interface SubmitResult {
  success: boolean;
  pointsEarned: number;
}

async function submitAnswerToServer(
  gameId: string,
  questionId: string,
  selectedIndex: number,
  timeMs: number,
  retries = 3
): Promise<SubmitResult> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await sdk.quickAuth.fetch(`/api/v1/games/${gameId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          selectedIndex,
          timeTakenMs: timeMs,
        }),
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
