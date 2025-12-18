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
  tierPrices: number[];
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
  pfpUrl: string | null;
  content: string;
  timestamp: number;
}

export interface Reaction {
  id: string;
  username: string;
  pfpUrl: string | null;
  type: string; // e.g., 'cheer'
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
  addReaction: (reaction: Reaction) => void;

  // Actions - Score (optimistic updates)
  updateScore: (points: number) => void;
  incrementAnswered: () => void;

  // Actions - Reset
  reset: () => void;

  // Chat function (set by useLive)
  sendChat: (text: string) => void;
  setSendChat: (fn: (text: string) => void) => void;

  // Event function (set by useLive)
  sendEvent: (type: string, content: string) => void;
  setSendEvent: (fn: (type: string, content: string) => void) => void;

  // Reaction function (set by useLive)
  sendReaction: (type?: string) => void;
  setSendReaction: (fn: (type?: string) => void) => void;

  // Reactions state
  reactions: Reaction[];
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
  reactions: [],
  sendChat: () => {}, // No-op until useLive sets it
  sendEvent: () => {}, // No-op until useLive sets it
  sendReaction: () => {}, // No-op until useLive sets it
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

      addReaction: (reaction) =>
        set(
          (state) => ({
            reactions: [...state.reactions.slice(-29), reaction], // Keep last 30
          }),
          false,
          "addReaction"
        ),

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

      // Chat function setter
      setSendChat: (fn) => set({ sendChat: fn }, false, "setSendChat"),

      // Event function setter
      setSendEvent: (fn) => set({ sendEvent: fn }, false, "setSendEvent"),

      // Reaction function setter
      setSendReaction: (fn) =>
        set({ sendReaction: fn }, false, "setSendReaction"),

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
export const selectSendChat = (state: GameStore) => state.sendChat;
export const selectSendEvent = (state: GameStore) => state.sendEvent;
export const selectReactions = (state: GameStore) => state.reactions;
export const selectSendReaction = (state: GameStore) => state.sendReaction;
