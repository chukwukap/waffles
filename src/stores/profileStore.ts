// Install Zustand: `npm install zustand`
import { create } from "zustand";

export interface Game {
  id: string;
  name: string;
  score: number;
  winnings: number;
  winningsColor: "green" | "gray";
}

export interface ProfileState {
  username: string;
  streak: number;
  stats: {
    games: number;
    wins: number;
    winnings: number;
  };
  pastGames: Game[];
  allTimeStats: {
    totalGames: number;
    wins: number;
    winRate: string;
    totalWon: string;
    highestScore: string;
    averageScore: number;
    currentStreak: number;
    bestRank: number;
  };
}

const initialState: ProfileState = {
  username: "POTAT0X",
  streak: 8,
  stats: {
    games: 0,
    wins: 0,
    winnings: 0,
  },
  pastGames: [
    {
      id: "1",
      name: "WAFFLE 567",
      score: 456,
      winnings: 0,
      winningsColor: "green",
    },
    {
      id: "2",
      name: "WAFFLE 444",
      score: 250,
      winnings: 999.99,
      winningsColor: "green",
    },
    {
      id: "3",
      name: "WAFFLE 342",
      score: 512,
      winnings: 150.75,
      winningsColor: "green",
    },
    {
      id: "4",
      name: "WAFFLE 233",
      score: 680,
      winnings: 800.42,
      winningsColor: "green",
    },
  ],
  allTimeStats: {
    totalGames: 8,
    wins: 2,
    winRate: "25%",
    totalWon: "$4,200",
    highestScore: "1,198",
    averageScore: 880,
    currentStreak: 8,
    bestRank: 2,
  },
};

export const useProfileStore = create<ProfileState>(() => initialState);
