import { create } from "zustand";

interface Pair {
  id: number;
  originalUrl: string;
  generatedUrl: string;
}

interface FinalRoundState {
  pairs: Pair[];
  score: number;
  timeLeft: number;
  status: "idle" | "playing" | "ended";
  fetchPairs: () => Promise<void>;
  submitMatch: (choiceId: number, targetId: number) => Promise<void>;
  startTimer: () => void;
  reset: () => void;
}

export const useFinalRoundStore = create<FinalRoundState>((set, get) => ({
  pairs: [],
  score: 0,
  timeLeft: 30,
  status: "idle",

  fetchPairs: async () => {
    const res = await fetch("/api/final/start");
    const data = await res.json();
    set({ pairs: data.pairs, status: "playing" });
    get().startTimer();
  },

  submitMatch: async (choiceId, targetId) => {
    try {
      const res = await fetch("/api/final/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: 1, gameId: 1, choiceId, targetId }),
      });
      const { points } = await res.json();
      set((s) => ({ score: s.score + points }));
    } catch (e) {
      console.error(e);
    }
  },

  startTimer: () => {
    const interval = setInterval(() => {
      set((s) => {
        if (s.timeLeft <= 1) {
          clearInterval(interval);
          return { ...s, status: "ended", timeLeft: 0 };
        }
        return { ...s, timeLeft: s.timeLeft - 1 };
      });
    }, 1000);
  },

  reset: () => set({ pairs: [], score: 0, timeLeft: 30, status: "idle" }),
}));
