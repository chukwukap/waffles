/**
 * Game Store
 *
 * Central state management for the game system.
 * Uses Zustand with per-request store factory for SSR safety.
 *
 * @see https://docs.pmnd.rs/zustand/guides/nextjs
 */

import { createStore } from "zustand";
import { devtools } from "zustand/middleware";
import type { Game, GameEntry } from "@prisma";

// ==========================================
// TYPES - Derived from Prisma
// ==========================================

// Subset of GameEntry model used in client state
export type GameEntryData = Pick<
  GameEntry,
  "id" | "score" | "answered" | "paidAt" | "rank" | "prize" | "claimedAt"
> & {
  answeredQuestionIds: string[]; // IDs of questions already answered
};

// ==========================================
// TYPES - Runtime only (not in DB)
// ==========================================

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

export interface RecentPlayer {
  username: string;
  pfpUrl: string | null;
  timestamp: number;
}

// ==========================================
// STATE INTERFACE
// ==========================================

export interface GameState {
  // === CORE ===
  entry: GameEntryData | null;
  prizePool: number | null;
  playerCount: number | null;

  // === REAL-TIME ===
  isConnected: boolean;
  onlineCount: number;
  messages: ChatMessage[];
  events: GameEvent[];
  recentPlayers: RecentPlayer[];
  questionAnswerers: RecentPlayer[]; // Players who answered current question

  // === ACTIONS - CORE ===
  setEntry: (entry: GameEntryData | null) => void;
  updateGameStats: (stats: {
    prizePool?: number;
    playerCount?: number;
  }) => void;

  // === ACTIONS - REAL-TIME ===
  setConnected: (connected: boolean) => void;
  setOnlineCount: (count: number) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addEvent: (event: GameEvent) => void;
  setEvents: (events: GameEvent[]) => void;
  addPlayer: (player: RecentPlayer) => void;
  setRecentPlayers: (players: RecentPlayer[]) => void;
  addAnswerer: (player: RecentPlayer) => void;
  clearAnswerers: () => void;

  // === ACTIONS - ENTRY ===
  incrementAnswered: () => void;

  // === ACTIONS - RESET ===
  reset: () => void;
}

// ==========================================
// INITIAL STATE
// ==========================================

const initialCoreState = {
  entry: null as GameEntryData | null,
  prizePool: null as number | null,
  playerCount: null as number | null,
};

const initialRealTimeState = {
  isConnected: false,
  onlineCount: 0,
  messages: [] as ChatMessage[],
  events: [] as GameEvent[],
  recentPlayers: [] as RecentPlayer[],
  questionAnswerers: [] as RecentPlayer[],
};

const initialState = {
  ...initialCoreState,
  ...initialRealTimeState,
};

// ==========================================
// STORE FACTORY (SSR-safe)
// ==========================================

export type GameStore = ReturnType<typeof createGameStore>;

export const createGameStore = () =>
  createStore<GameState>()(
    devtools(
      (set, get) => ({
        ...initialState,

        // === CORE ACTIONS ===
        setEntry: (entry) => set({ entry }, false, "setEntry"),
        updateGameStats: (stats) =>
          set(
            (state) => ({
              prizePool: stats.prizePool ?? state.prizePool,
              playerCount: stats.playerCount ?? state.playerCount,
            }),
            false,
            "updateGameStats"
          ),

        // === REAL-TIME ACTIONS ===
        setConnected: (isConnected) =>
          set({ isConnected }, false, "setConnected"),
        setOnlineCount: (onlineCount) =>
          set({ onlineCount }, false, "setOnlineCount"),

        addMessage: (message) =>
          set(
            (state) => ({
              messages: [...state.messages.slice(-99), message],
            }),
            false,
            "addMessage"
          ),

        setMessages: (messages) => set({ messages }, false, "setMessages"),

        addEvent: (event) =>
          set(
            (state) => ({
              events: [...state.events.slice(-49), event],
            }),
            false,
            "addEvent"
          ),

        setEvents: (events) => set({ events }, false, "setEvents"),

        addPlayer: (player) =>
          set(
            (state) => ({
              recentPlayers: [
                player,
                ...state.recentPlayers.filter(
                  (p) => p.username !== player.username
                ),
              ].slice(0, 20),
            }),
            false,
            "addPlayer"
          ),

        setRecentPlayers: (players) =>
          set({ recentPlayers: players }, false, "setRecentPlayers"),

        addAnswerer: (player) =>
          set(
            (state) => ({
              // Add to front, keep latest 10
              questionAnswerers: [
                player,
                ...state.questionAnswerers.filter(
                  (p) => p.username !== player.username
                ),
              ].slice(0, 10),
            }),
            false,
            "addAnswerer"
          ),

        clearAnswerers: () =>
          set({ questionAnswerers: [] }, false, "clearAnswerers"),

        // === ENTRY ACTIONS ===

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

        // === RESET ===
        reset: () => set(initialState, false, "reset"),
      }),
      { name: "game-store" }
    )
  );

// ==========================================
// NOTE: All store access should go through GameStoreProvider
// Use useGameStore from @/components/providers/GameStoreProvider
// ==========================================

// ==========================================
// SELECTORS (for performance)
// ==========================================

export const selectEntry = (state: GameState) => state.entry;
export const selectPrizePool = (state: GameState) => state.prizePool;
export const selectPlayerCount = (state: GameState) => state.playerCount;
export const selectHasEntry = (state: GameState) => state.entry !== null;
export const selectIsConnected = (state: GameState) => state.isConnected;
export const selectOnlineCount = (state: GameState) => state.onlineCount;
export const selectMessages = (state: GameState) => state.messages;
export const selectEvents = (state: GameState) => state.events;
export const selectAnswered = (state: GameState) => state.entry?.answered ?? 0;
export const selectRecentPlayers = (state: GameState) => state.recentPlayers;
export const selectQuestionAnswerers = (state: GameState) =>
  state.questionAnswerers;
