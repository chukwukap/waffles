import { create } from "zustand";

export type User = {
  rank: number;
  name: string;
  avatar: React.ReactNode;
  score: number;
};

type LeaderboardData = {
  data: User;
  isLoading: boolean;
  error: string | null;
};

export type LeaderboardState = {
  activeTab: "current" | "allTime";
  currentLeaderboard: LeaderboardData;
  allTimeLeaderboard: LeaderboardData;
};

export type LeaderboardActions = {
  setActiveTab: (tab: "current" | "allTime") => void;
  fetchCurrentLeaderboard: () => Promise<void>;
  fetchAllTimeLeaderboard: () => Promise<void>;
};

export type LeaderboardStore = LeaderboardState & LeaderboardActions;

const initialState: LeaderboardState = {
  activeTab: "allTime",
  currentLeaderboard: {
    data: { rank: 0, name: "", avatar: "", score: 0 },
    isLoading: false,
    error: null,
  },
  allTimeLeaderboard: {
    data: { rank: 0, name: "", avatar: "", score: 0 },
    isLoading: false,
    error: null,
  },
};

export const useLeaderboardStore = create<LeaderboardStore>((set) => ({
  ...initialState,
  setActiveTab: (tab) => set({ activeTab: tab }),
  fetchCurrentLeaderboard: async () => {
    set((state) => ({
      currentLeaderboard: {
        ...state.currentLeaderboard,
        isLoading: true,
        error: null,
      },
    }));
    try {
      const response = await fetch("/api/leaderboard/current");
      if (!response.ok) throw new Error("Failed to fetch current leaderboard");
      const data: User = await response.json();
      set({ currentLeaderboard: { data, isLoading: false, error: null } });
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "An unknown error occurred";
      set((state) => ({
        currentLeaderboard: {
          ...state.currentLeaderboard,
          isLoading: false,
          error: msg,
        },
      }));
    }
  },
  fetchAllTimeLeaderboard: async () => {
    set((state) => ({
      allTimeLeaderboard: {
        ...state.allTimeLeaderboard,
        isLoading: true,
        error: null,
      },
    }));
    try {
      const response = await fetch("/api/leaderboard/alltime");
      if (!response.ok) throw new Error("Failed to fetch all-time leaderboard");
      const data: User = await response.json();
      set({ allTimeLeaderboard: { data, isLoading: false, error: null } });
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "An unknown error occurred";
      set((state) => ({
        allTimeLeaderboard: {
          ...state.allTimeLeaderboard,
          isLoading: false,
          error: msg,
        },
      }));
    }
  },
}));
