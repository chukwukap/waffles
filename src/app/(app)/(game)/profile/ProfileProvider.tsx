"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/miniapp-sdk";

// ==========================================
// TYPES
// ==========================================

export interface ProfileUser {
    fid: number;
    username: string | null;
    pfpUrl: string | null;
    wallet: string | null;
    inviteCode: string | null;
    hasGameAccess: boolean;
    isBanned: boolean;
    waitlistPoints: number;
    rank: number;
    invitesCount: number;
}

export interface ProfileStats {
    totalGames: number;
    wins: number;
    winRate: number;
    totalWon: number;
    highestScore: number;
    avgScore: number;
    currentStreak: number;
    bestRank: number | null;
}

export interface ProfileGame {
    id: number;
    onchainId: string | null;
    title: string;
    theme: string;
    score: number;
    rank: number | null;
    winnings: number;
    claimedAt: Date | null;
}

interface ProfileContextValue {
    user: ProfileUser | null;
    stats: ProfileStats | null;
    games: ProfileGame[];
    isLoading: boolean;
    refetch: () => Promise<void>;
    claimPrize: (gameId: number) => Promise<boolean>;
}

// ==========================================
// CONTEXT
// ==========================================

const ProfileContext = createContext<ProfileContextValue | null>(null);

// ==========================================
// HOOK
// ==========================================

export function useProfile(): ProfileContextValue {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error("useProfile must be used within a ProfileProvider");
    }
    return context;
}

// ==========================================
// PROVIDER
// ==========================================

interface ProfileProviderProps {
    children: ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
    const router = useRouter();
    const [user, setUser] = useState<ProfileUser | null>(null);
    const [stats, setStats] = useState<ProfileStats | null>(null);
    const [games, setGames] = useState<ProfileGame[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await sdk.quickAuth.fetch("/api/v1/me/profile");

            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/redeem");
                    return;
                }
                throw new Error("Failed to fetch profile");
            }

            const data = await res.json();

            // Set user info
            setUser({
                fid: data.fid,
                username: data.username,
                pfpUrl: data.pfpUrl,
                wallet: data.wallet,
                inviteCode: data.inviteCode,
                hasGameAccess: data.hasGameAccess,
                isBanned: data.isBanned,
                waitlistPoints: data.waitlistPoints,
                rank: data.rank,
                invitesCount: data.invitesCount,
            });

            // Set stats
            setStats({
                totalGames: data.stats.totalGames,
                wins: data.stats.wins,
                winRate: data.stats.winRate,
                totalWon: data.stats.totalWon,
                highestScore: data.stats.highestScore,
                avgScore: data.stats.avgScore,
                currentStreak: data.stats.currentStreak,
                bestRank: data.stats.bestRank,
            });

            // Set games
            setGames(
                data.gameHistory.map((g: any) => ({
                    id: g.id,
                    onchainId: g.onchainId ?? null,
                    title: g.name,
                    theme: g.theme,
                    score: g.score,
                    rank: g.rank,
                    winnings: g.winnings,
                    claimedAt: g.claimedAt ? new Date(g.claimedAt) : null,
                }))
            );
        } catch (error) {
            console.error("[ProfileProvider] Error fetching profile:", error);
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    // Fetch on mount
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Claim prize action
    const claimPrize = useCallback(async (gameId: number): Promise<boolean> => {
        try {
            const res = await sdk.quickAuth.fetch("/api/v1/prizes/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to claim prize");
            }

            const data = await res.json();

            // Optimistically update local state
            setGames((prev) =>
                prev.map((g) =>
                    g.id === gameId ? { ...g, claimedAt: new Date(data.claimedAt) } : g
                )
            );

            return true;
        } catch (error) {
            console.error("[ProfileProvider] Claim error:", error);
            return false;
        }
    }, []);

    const value: ProfileContextValue = {
        user,
        stats,
        games,
        isLoading,
        refetch: fetchProfile,
        claimPrize,
    };

    return (
        <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
    );
}
