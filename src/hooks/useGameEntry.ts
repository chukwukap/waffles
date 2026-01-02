/**
 * useGameEntry Hook
 *
 * Fetches user's game entry and syncs to Zustand store.
 *
 * NOTE: Entry data requires auth which is only available client-side
 * in Farcaster Mini Apps (Quick Auth tokens from minikit SDK).
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { useGameStoreApi } from "@/components/providers/GameStoreProvider";
import type { GameEntryData } from "@/lib/game-store";

interface UseGameEntryOptions {
  gameId: number | undefined;
  initialEntry?: GameEntryData | null;
  enabled?: boolean;
}

interface UseGameEntryReturn {
  entry: GameEntryData | null;
  isLoading: boolean;
  error: string | null;
  refetchEntry: () => Promise<void>;
}

/**
 * Fetch user's entry for a game and sync to global store.
 *
 * Auth is only available client-side in Farcaster Mini Apps,
 * so this hook correctly fetches data client-side.
 */
export function useGameEntry({
  gameId,
  initialEntry,
  enabled = true,
}: UseGameEntryOptions): UseGameEntryReturn {
  const [isLoading, setIsLoading] = useState(!initialEntry);
  const [error, setError] = useState<string | null>(null);
  const [entry, setLocalEntry] = useState<GameEntryData | null>(
    initialEntry ?? null
  );

  // Get store API for state updates
  const store = useGameStoreApi();

  // Sync initial entry to store
  useEffect(() => {
    if (initialEntry) {
      store.setState({ entry: initialEntry });
    }
  }, [initialEntry, store]);

  const fetchEntry = useCallback(async () => {
    if (!gameId || !enabled) {
      setLocalEntry(null);
      store.setState({ entry: null });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await sdk.quickAuth.fetch(`/api/v1/games/${gameId}/entry`);

      if (res.ok) {
        const data = await res.json();
        const entryData: GameEntryData = {
          id: data.id,
          score: data.score ?? 0,
          answered: data.answered ?? 0,
          answeredQuestionIds: data.answeredQuestionIds ?? [],
          paidAt: data.paidAt ? new Date(data.paidAt) : null,
          rank: data.rank ?? null,
          prize: data.prize ?? null,
          claimedAt: data.claimedAt ? new Date(data.claimedAt) : null,
        };
        setLocalEntry(entryData);
        store.setState({ entry: entryData });
      } else if (res.status === 404) {
        // No entry yet - this is normal
        setLocalEntry(null);
        store.setState({ entry: null });
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.error("[useGameEntry] Error:", err);
      setError("Failed to fetch entry");
      setLocalEntry(null);
      store.setState({ entry: null });
    } finally {
      setIsLoading(false);
    }
  }, [gameId, enabled, store]);

  // Fetch on mount and when gameId changes (skip if initial provided)
  useEffect(() => {
    if (!initialEntry) {
      fetchEntry();
    }
  }, [fetchEntry, initialEntry]);

  return {
    entry,
    isLoading,
    error,
    refetchEntry: fetchEntry,
  };
}
