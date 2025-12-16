/**
 * Game Store
 *
 * Central state management for the game system.
 * Uses Zustand for minimal re-renders via selectors.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GamePhase } from "./game-utils";

// ==========================================
// TYPES
// ==========================================

export interface GameData {
  id: number;
  title: string;
  theme: string;
  coverUrl: string | null;
  startsAt: Date;
  endsAt: Date;
  ticketPrice: number;
  prizePool: number;
  playerCount: number;
  maxPlayers: number;
}

export interface GameEntryData {
  id: number;
  score: number;
  answered: number;
  paidAt: Date | null;
  rank: number | null;
  prize: number | null;
}

export interface ChatMessage {
  id: string;
  username: string;
  pfpUrl: string | null;
  text: string;
  timestamp: number;
}

export interface GameEvent {
  id: string;
  type: "join" | "answer" | "achievement";
  username: string;
  content: string;
  timestamp: number;
}

// ==========================================
// STORE INTERFACE
// ==========================================

interface GameStore {
  // Game data (set from server)
  game: GameData | null;
  phase: GamePhase;

  // User's entry (fetched after auth)
  entry: GameEntryData | null;

  // Real-time state
  isConnected: boolean;
  onlineCount: number;
  messages: ChatMessage[];
  events: GameEvent[];

  // Actions - Game
  setGame: (game: GameData | null) => void;
  setPhase: (phase: GamePhase) => void;
  setEntry: (entry: GameEntryData | null) => void;

  // Actions - Real-time
  setConnected: (connected: boolean) => void;
  setOnlineCount: (count: number) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addEvent: (event: GameEvent) => void;
  setEvents: (events: GameEvent[]) => void;

  // Actions - Score (optimistic updates)
  updateScore: (points: number) => void;
  incrementAnswered: () => void;

  // Actions - Reset
  reset: () => void;
}

// ==========================================
// INITIAL STATE
// ==========================================

const initialState = {
  game: null,
  phase: "SCHEDULED" as GamePhase,
  entry: null,
  isConnected: false,
  onlineCount: 0,
  messages: [],
  events: [],
};

// ==========================================
// STORE IMPLEMENTATION
// ==========================================

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Game actions
      setGame: (game) => set({ game }, false, "setGame"),
      setPhase: (phase) => set({ phase }, false, "setPhase"),
      setEntry: (entry) => set({ entry }, false, "setEntry"),

      // Real-time actions
      setConnected: (isConnected) =>
        set({ isConnected }, false, "setConnected"),
      setOnlineCount: (onlineCount) =>
        set({ onlineCount }, false, "setOnlineCount"),

      addMessage: (message) =>
        set(
          (state) => ({
            messages: [...state.messages.slice(-99), message], // Keep last 100
          }),
          false,
          "addMessage"
        ),

      setMessages: (messages) => set({ messages }, false, "setMessages"),

      addEvent: (event) =>
        set(
          (state) => ({
            events: [...state.events.slice(-19), event], // Keep last 20
          }),
          false,
          "addEvent"
        ),

      setEvents: (events) => set({ events }, false, "setEvents"),

      // Score actions (optimistic)
      updateScore: (points) =>
        set(
          (state) => ({
            entry: state.entry
              ? { ...state.entry, score: state.entry.score + points }
              : null,
          }),
          false,
          "updateScore"
        ),

      incrementAnswered: () =>
        set(
          (state) => ({
            entry: state.entry
              ? { ...state.entry, answered: state.entry.answered + 1 }
              : null,
          }),
          false,
          "incrementAnswered"
        ),

      // Reset
      reset: () => set(initialState, false, "reset"),
    }),
    { name: "game-store" }
  )
);

// ==========================================
// SELECTORS (for performance)
// ==========================================

export const selectGame = (state: GameStore) => state.game;
export const selectPhase = (state: GameStore) => state.phase;
export const selectEntry = (state: GameStore) => state.entry;
export const selectHasEntry = (state: GameStore) => state.entry !== null;
export const selectIsConnected = (state: GameStore) => state.isConnected;
export const selectOnlineCount = (state: GameStore) => state.onlineCount;
export const selectMessages = (state: GameStore) => state.messages;
export const selectEvents = (state: GameStore) => state.events;
export const selectScore = (state: GameStore) => state.entry?.score ?? 0;
export const selectAnswered = (state: GameStore) => state.entry?.answered ?? 0;
