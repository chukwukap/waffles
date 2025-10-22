import { create } from "zustand";

interface Entry {
  rank: number;
  username: string;
  points: number;
  pfpUrl: string | null;
}

interface MyRank {
  username?: string;
  rank?: number;
  points?: number;
}

interface LeaderboardState {
  entries: Entry[];
  me: MyRank | null;
  fetchLeaderboard: (gameId: number, userId: number) => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  entries: [],
  me: null,
  fetchLeaderboard: async (gameId, userId) => {
    try {
      const res = await fetch(
        `/api/leaderboard?gameId=${gameId}&userId=${userId}`
      );
      const data = await res.json();
      set({ entries: data.top, me: data.me });
    } catch (e) {
      console.error(e);
    }
  },
}));
