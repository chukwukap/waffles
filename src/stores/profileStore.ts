// ───────────────────────── src/stores/profileStore.ts ─────────────────────────
import { create } from "zustand";

export interface GameHistory {
  id: number | string;
  name: string;
  score: number;
  winnings: number;
  winningsColor?: "green" | "gray";
}

export interface AllTimeStats {
  totalGames: number;
  wins: number;
  winRate: string; // formatted "80%"
  totalWon: string; // formatted "$50.00"
  highestScore: number;
  averageScore: number;
  currentStreak: number;
  bestRank: number | string;
}

interface ProfileState {
  id: number | null;
  username: string;
  wallet: string;
  imageUrl: string;
  streak: number;

  stats: { games: number; wins: number; winnings: number };
  gameHistory: GameHistory[];
  allTimeStats: AllTimeStats;

  loading: boolean;
  error: string | null;
  currentFarcasterId: string | null;
  hasLoaded: boolean;

  fetchProfile: (
    farcasterId: string,
    opts?: { force?: boolean }
  ) => Promise<void>;
  updateProfile: (
    farcasterId: string,
    payload: Partial<{ name: string; wallet: string; imageUrl: string }>
  ) => Promise<void>;
}

// ───────────────────────── STORE ─────────────────────────
export const useProfileStore = create<ProfileState>((set, get) => ({
  id: null,
  username: "",
  wallet: "",
  imageUrl: "",
  streak: 0,

  stats: { games: 0, wins: 0, winnings: 0 },
  gameHistory: [],
  allTimeStats: {
    totalGames: 0,
    wins: 0,
    winRate: "0%",
    totalWon: "$0",
    highestScore: 0,
    averageScore: 0,
    currentStreak: 0,
    bestRank: "-",
  },

  loading: false,
  error: null,
  currentFarcasterId: null,
  hasLoaded: false,

  // Unified fetch (calls 3 API routes)
  fetchProfile: async (farcasterId, opts) => {
    if (!farcasterId) return;
    const state = get();
    if (
      !opts?.force &&
      state.currentFarcasterId === farcasterId &&
      state.hasLoaded &&
      !state.loading
    ) {
      return;
    }

    set({ loading: true, error: null });
    set({ currentFarcasterId: farcasterId });

    try {
      // 1️⃣ Fetch basic info
      const [profileRes, statsRes, historyRes] = await Promise.all([
        fetch("/api/profile", {
          headers: { "x-farcaster-id": farcasterId },
        }),
        fetch("/api/profile/stats", {
          headers: { "x-farcaster-id": farcasterId },
        }),
        fetch("/api/profile/history", {
          headers: { "x-farcaster-id": farcasterId },
        }),
      ]);

      if (!profileRes.ok) throw new Error("Profile fetch failed");
      if (!statsRes.ok) throw new Error("Stats fetch failed");
      if (!historyRes.ok) throw new Error("History fetch failed");

      const profile = await profileRes.json();
      const stats = await statsRes.json();
      const history = await historyRes.json();

      const winRateStr = `${Math.round(stats.winRate)}%`;
      const totalWonStr = `$${stats.totalWon.toFixed(2)}`;

      set({
        id: profile.id,
        username: profile.name || "Anonymous",
        wallet: profile.wallet || "",
        imageUrl: profile.imageUrl || "/images/avatars/a.png",
        streak: stats.currentStreak || 0,

        stats: {
          games: stats.totalGames || 0,
          wins: stats.wins || 0,
          winnings: stats.totalWon || 0,
        },
        allTimeStats: {
          totalGames: stats.totalGames,
          wins: stats.wins,
          winRate: winRateStr,
          totalWon: totalWonStr,
          highestScore: stats.highestScore,
          averageScore: stats.avgScore,
          currentStreak: stats.currentStreak,
          bestRank: stats.bestRank,
        },
        gameHistory: history,
        loading: false,
        hasLoaded: true,
      });
    } catch (err: unknown) {
      console.error("Profile load failed:", err);
      set({
        error: err instanceof Error ? err.message : "Failed to load profile",
        loading: false,
        hasLoaded: false,
      });
    }
  },

  // Update basic info
  updateProfile: async (farcasterId, payload) => {
    if (!farcasterId) return;
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-farcaster-id": farcasterId,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      set({
        username: updated.name ?? "",
        wallet: updated.wallet ?? "",
        imageUrl: updated.imageUrl ?? "",
      });
    } catch (e: unknown) {
      console.error("Profile update failed:", e);
      set({
        error: e instanceof Error ? e.message : "Failed to update profile",
        loading: false,
      });
    }
  },
}));
