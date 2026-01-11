/**
 * useGameEntry Hook
 *
 * Fetches user's game entry from the server.
 * Entry data (ticket, score, rank) requires auth which is only available
 * client-side in Farcaster Mini Apps.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";

interface EntryData {
  id: string;
  score: number;
  answered: number;
  answeredQuestionIds: string[];
  paidAt: Date | null;
  rank: number | null;
  prize: number | null;
  claimedAt: Date | null;
}

interface UseGameEntryOptions {
  gameId: string | undefined;
  enabled?: boolean;
}

interface UseGameEntryReturn {
  entry: EntryData | null;
  isLoading: boolean;
  error: string | null;
  refetchEntry: () => Promise<void>;
}

export function useGameEntry({
  gameId,
  enabled = true,
}: UseGameEntryOptions): UseGameEntryReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<EntryData | null>(null);

  const fetchEntry = useCallback(async () => {
    if (!gameId || !enabled) {
      setEntry(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await sdk.quickAuth.fetch(`/api/v1/games/${gameId}/entry`);

      if (res.ok) {
        const data = await res.json();
        setEntry({
          id: data.id,
          score: data.score ?? 0,
          answered: data.answered ?? 0,
          answeredQuestionIds: data.answeredQuestionIds ?? [],
          paidAt: data.paidAt ? new Date(data.paidAt) : null,
          rank: data.rank ?? null,
          prize: data.prize ?? null,
          claimedAt: data.claimedAt ? new Date(data.claimedAt) : null,
        });
      } else if (res.status === 404) {
        // No entry yet - this is normal
        setEntry(null);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.error("[useGameEntry] Error:", err);
      setError("Failed to fetch entry");
      setEntry(null);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, enabled]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  return {
    entry,
    isLoading,
    error,
    refetchEntry: fetchEntry,
  };
}
