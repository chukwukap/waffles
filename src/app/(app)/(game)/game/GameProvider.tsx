"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from "react";
import sdk from "@farcaster/miniapp-sdk";

// ==========================================
// TYPES
// ==========================================

export interface GameEntry {
    id: number;
    paidAt: Date | null;
    score: number;
    answered: number;
    answers: Record<number, { selectedIndex: number; answeredAt: string }>;
    rank: number | null;
    prize: number | null;
}

interface GameContextValue {
    entry: GameEntry | null;
    isLoading: boolean;
    refetchEntry: () => Promise<void>;
}

// ==========================================
// CONTEXT
// ==========================================

const GameContext = createContext<GameContextValue | null>(null);

// ==========================================
// HOOK
// ==========================================

export function useGame(): GameContextValue {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error("useGame must be used within a GameProvider");
    }
    return context;
}

// ==========================================
// PROVIDER
// ==========================================

interface GameProviderProps {
    gameId: number | undefined;
    children: ReactNode;
}

export function GameProvider({ gameId, children }: GameProviderProps) {
    const [entry, setEntry] = useState<GameEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEntry = useCallback(async () => {
        if (!gameId) {
            setEntry(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await sdk.quickAuth.fetch(`/api/v1/games/${gameId}/entry`);
            if (res.ok) {
                const data = await res.json();
                setEntry({
                    id: data.id,
                    paidAt: data.paidAt ? new Date(data.paidAt) : null,
                    score: data.score ?? 0,
                    answered: data.answered ?? 0,
                    answers: data.answers ?? {},
                    rank: data.rank ?? null,
                    prize: data.prize ?? null,
                });
            } else {
                // No entry for this user/game
                setEntry(null);
            }
        } catch (error) {
            console.error("[GameProvider] Error fetching entry:", error);
            setEntry(null);
        } finally {
            setIsLoading(false);
        }
    }, [gameId]);

    // Fetch on mount and when gameId changes
    useEffect(() => {
        fetchEntry();
    }, [fetchEntry]);

    const value: GameContextValue = {
        entry,
        isLoading,
        refetchEntry: fetchEntry,
    };

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
