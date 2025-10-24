"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";

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
  winRate: string;
  totalWon: string;
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
}

type ProfileAction =
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_PROFILE"; payload: Partial<ProfileState> }
  | { type: "SET_CURRENT_FID"; fid: string | null }
  | { type: "RESET" };

const initialState: ProfileState = {
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
};

function profileReducer(
  state: ProfileState,
  action: ProfileAction
): ProfileState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_PROFILE":
      return { ...state, ...action.payload };
    case "SET_CURRENT_FID":
      return { ...state, currentFarcasterId: action.fid };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface ProfileContextValue extends ProfileState {
  fetchProfile: (
    farcasterId: string,
    opts?: { force?: boolean }
  ) => Promise<void>;
  updateProfile: (
    farcasterId: string,
    payload: Partial<{ name: string; wallet: string; imageUrl: string }>
  ) => Promise<void>;
  resetProfile: () => void;
}

const ProfileContext =
  createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(profileReducer, initialState);

  const fetchProfile = useCallback(
    async (farcasterId: string, opts?: { force?: boolean }) => {
      if (!farcasterId) return;
      if (
        !opts?.force &&
        state.currentFarcasterId === farcasterId &&
        state.hasLoaded &&
        !state.loading
      ) {
        return;
      }

      dispatch({ type: "SET_LOADING", value: true });
      dispatch({ type: "SET_ERROR", error: null });
      dispatch({ type: "SET_CURRENT_FID", fid: farcasterId });

      try {
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
        const history = (await historyRes.json()) as GameHistory[];

        const winRateStr = `${Math.round(stats.winRate || 0)}%`;
        const totalWonStr = `$${Number(stats.totalWon || 0).toFixed(2)}`;

        dispatch({
          type: "SET_PROFILE",
          payload: {
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
          },
        });
      } catch (error) {
        console.error("fetchProfile error:", error);
        dispatch({
          type: "SET_ERROR",
          error:
            error instanceof Error ? error.message : "Failed to load profile",
        });
        dispatch({ type: "SET_LOADING", value: false });
        dispatch({ type: "SET_PROFILE", payload: { hasLoaded: false } });
      }
    },
    [state.currentFarcasterId, state.hasLoaded, state.loading]
  );

  const updateProfile = useCallback(
    async (
      farcasterId: string,
      payload: Partial<{ name: string; wallet: string; imageUrl: string }>
    ) => {
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
        dispatch({
          type: "SET_PROFILE",
          payload: {
            username: updated.name ?? state.username,
            wallet: updated.wallet ?? state.wallet,
            imageUrl: updated.imageUrl ?? state.imageUrl,
          },
        });
      } catch (error) {
        console.error("updateProfile error:", error);
        dispatch({
          type: "SET_ERROR",
          error:
            error instanceof Error ? error.message : "Failed to update profile",
        });
      }
    },
    [state.imageUrl, state.username, state.wallet]
  );

  const resetProfile = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      ...state,
      fetchProfile,
      updateProfile,
      resetProfile,
    }),
    [state, fetchProfile, updateProfile, resetProfile]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
