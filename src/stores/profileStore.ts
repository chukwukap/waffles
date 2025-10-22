import { create } from "zustand";

interface GameHistory {
  gameTitle: string;
  points: number;
  date: string;
}

interface ProfileData {
  username: string;
  wallet: string;
  totalPoints: number;
  wins: number;
  streak: number;
  badges: string[];
  history: GameHistory[];
}

interface ProfileState {
  profile: ProfileData | null;
  fetchProfile: (userId: number) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  fetchProfile: async (userId) => {
    try {
      const res = await fetch(`/api/profile?userId=${userId}`);
      const data = await res.json();
      set({ profile: data });
    } catch (e) {
      console.error(e);
    }
  },
}));
