"use client";

import { useCallback, useRef, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";

// ==========================================
// TYPES
// ==========================================

interface QueuedAnswer {
  questionId: number;
  selectedIndex: number | null;
  responseTimeMs: number;
  retries: number;
  status: "pending" | "syncing" | "synced" | "failed";
}

interface AnswerQueueState {
  answers: Map<number, QueuedAnswer>;
  pendingCount: number;
  failedCount: number;
}

// ==========================================
// HOOK
// ==========================================

/**
 * useAnswerQueue - Queue answers locally and sync in background
 *
 * This hook ensures answer submissions are reliable:
 * 1. Immediately queues answer locally (optimistic)
 * 2. Syncs to server in background
 * 3. Retries failed submissions with exponential backoff
 * 4. Provides status for each answer
 */
export function useAnswerQueue(gameId: number) {
  const [state, setState] = useState<AnswerQueueState>({
    answers: new Map(),
    pendingCount: 0,
    failedCount: 0,
  });

  const syncInProgressRef = useRef<Set<number>>(new Set());
  const maxRetries = 3;

  // Submit answer to queue
  const submit = useCallback(
    async (
      questionId: number,
      selectedIndex: number | null,
      responseTimeMs: number
    ) => {
      // Add to queue as pending
      const answer: QueuedAnswer = {
        questionId,
        selectedIndex,
        responseTimeMs,
        retries: 0,
        status: "pending",
      };

      setState((prev) => {
        const newAnswers = new Map(prev.answers);
        newAnswers.set(questionId, answer);
        return {
          answers: newAnswers,
          pendingCount: prev.pendingCount + 1,
          failedCount: prev.failedCount,
        };
      });

      // Start sync
      await syncAnswer(questionId);
    },
    [gameId]
  );

  // Sync single answer to server
  const syncAnswer = useCallback(
    async (questionId: number) => {
      // Prevent duplicate syncs
      if (syncInProgressRef.current.has(questionId)) return;
      syncInProgressRef.current.add(questionId);

      setState((prev) => {
        const newAnswers = new Map(prev.answers);
        const answer = newAnswers.get(questionId);
        if (answer) {
          newAnswers.set(questionId, { ...answer, status: "syncing" });
        }
        return { ...prev, answers: newAnswers };
      });

      try {
        const answer = state.answers.get(questionId);
        if (!answer) {
          syncInProgressRef.current.delete(questionId);
          return;
        }

        const res = await sdk.quickAuth.fetch(
          `/api/v1/games/${gameId}/answers`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              questionId: answer.questionId,
              selectedIndex: answer.selectedIndex,
              responseTimeMs: answer.responseTimeMs,
            }),
          }
        );

        if (res.ok) {
          // Success - mark as synced
          setState((prev) => {
            const newAnswers = new Map(prev.answers);
            const a = newAnswers.get(questionId);
            if (a) {
              newAnswers.set(questionId, { ...a, status: "synced" });
            }
            return {
              answers: newAnswers,
              pendingCount: Math.max(0, prev.pendingCount - 1),
              failedCount: prev.failedCount,
            };
          });
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (error) {
        console.error(`[AnswerQueue] Sync failed for Q${questionId}:`, error);

        // Handle failure with retry logic
        setState((prev) => {
          const newAnswers = new Map(prev.answers);
          const answer = newAnswers.get(questionId);
          if (answer) {
            const newRetries = answer.retries + 1;
            const isFailed = newRetries >= maxRetries;
            newAnswers.set(questionId, {
              ...answer,
              retries: newRetries,
              status: isFailed ? "failed" : "pending",
            });
            return {
              answers: newAnswers,
              pendingCount: isFailed
                ? prev.pendingCount - 1
                : prev.pendingCount,
              failedCount: isFailed ? prev.failedCount + 1 : prev.failedCount,
            };
          }
          return prev;
        });

        // Schedule retry with exponential backoff
        const answer = state.answers.get(questionId);
        if (answer && answer.retries < maxRetries - 1) {
          const delay = Math.pow(2, answer.retries) * 1000; // 1s, 2s, 4s
          setTimeout(() => syncAnswer(questionId), delay);
        }
      } finally {
        syncInProgressRef.current.delete(questionId);
      }
    },
    [gameId, state.answers]
  );

  // Retry all failed answers
  const retryFailed = useCallback(() => {
    state.answers.forEach((answer, questionId) => {
      if (answer.status === "failed") {
        setState((prev) => {
          const newAnswers = new Map(prev.answers);
          newAnswers.set(questionId, {
            ...answer,
            retries: 0,
            status: "pending",
          });
          return {
            answers: newAnswers,
            pendingCount: prev.pendingCount + 1,
            failedCount: Math.max(0, prev.failedCount - 1),
          };
        });
        syncAnswer(questionId);
      }
    });
  }, [state.answers, syncAnswer]);

  // Get answer status for a question
  const getStatus = useCallback(
    (questionId: number) => {
      return state.answers.get(questionId)?.status ?? null;
    },
    [state.answers]
  );

  return {
    submit,
    retryFailed,
    getStatus,
    pendingCount: state.pendingCount,
    failedCount: state.failedCount,
    hasPending: state.pendingCount > 0,
    hasFailed: state.failedCount > 0,
  };
}
