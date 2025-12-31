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
import type { Game, GameEntry, Question as PrismaQuestion } from "@/lib/db";

// ==========================================
// TYPES - Derived from Prisma
// ==========================================

// Subset of Game model used in client state
export type GameData = Pick<
  Game,
  | "id"
  | "title"
  | "theme"
  | "coverUrl"
  | "startsAt"
  | "endsAt"
  | "tierPrices"
  | "prizePool"
  | "playerCount"
  | "maxPlayers"
>;

// Subset of GameEntry model used in client state
export type GameEntryData = Pick<
  GameEntry,
  "id" | "score" | "answered" | "paidAt" | "rank" | "prize" | "claimedAt"
>;

// Subset of Question model used in client state
export type Question = Pick<
  PrismaQuestion,
  | "id"
  | "content"
  | "mediaUrl"
  | "soundUrl"
  | "options"
  | "correctIndex"
  | "durationSec"
  | "points"
  | "roundIndex"
  | "orderInRound"
>;

// ==========================================
// TYPES - Runtime only (not in DB)
// ==========================================

export interface Answer {
  questionId: number;
  selected: number;
  timeMs: number;
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
  type: string;
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
  game: GameData | null;
  entry: GameEntryData | null;

  // === LIVE SESSION ===
  questions: Question[];
  answers: Map<number, Answer>;
  questionIndex: number;
  isBreak: boolean;
  timerTarget: number;
  gameStarted: boolean;
  isGameComplete: boolean;
  roundBreakSec: number;

  // === REAL-TIME ===
  isConnected: boolean;
  onlineCount: number;
  messages: ChatMessage[];
  events: GameEvent[];
  reactions: Reaction[];
  recentPlayers: RecentPlayer[];

  // === ACTIONS - CORE ===
  setGame: (game: GameData | null) => void;
  setEntry: (entry: GameEntryData | null) => void;

  // === ACTIONS - LIVE SESSION ===
  setQuestions: (questions: Question[], roundBreakSec?: number) => void;
  submitAnswer: (questionId: number, selected: number, timeMs: number) => void;
  advanceQuestion: () => void;
  setQuestionIndex: (index: number) => void;
  setIsBreak: (isBreak: boolean) => void;
  setTimerTarget: (target: number) => void;
  setGameStarted: (started: boolean) => void;
  setGameComplete: (complete: boolean) => void;
  resetLiveSession: () => void;

  // === ACTIONS - REAL-TIME ===
  setConnected: (connected: boolean) => void;
  setOnlineCount: (count: number) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addEvent: (event: GameEvent) => void;
  setEvents: (events: GameEvent[]) => void;
  addReaction: (reaction: Reaction) => void;
  addPlayer: (player: RecentPlayer) => void;
  setRecentPlayers: (players: RecentPlayer[]) => void;

  // === ACTIONS - SCORE ===
  updateScore: (points: number) => void;
  incrementAnswered: () => void;

  // === ACTIONS - RESET ===
  reset: () => void;
}

// ==========================================
// INITIAL STATE
// ==========================================

const initialCoreState = {
  game: null as GameData | null,
  entry: null as GameEntryData | null,
};

const initialLiveState = {
  questions: [] as Question[],
  answers: new Map<number, Answer>(),
  questionIndex: 0,
  isBreak: false,
  timerTarget: Date.now() + 999999999,
  gameStarted: false,
  isGameComplete: false,
  roundBreakSec: 5,
};

const initialRealTimeState = {
  isConnected: false,
  onlineCount: 0,
  messages: [] as ChatMessage[],
  events: [] as GameEvent[],
  reactions: [] as Reaction[],
  recentPlayers: [] as RecentPlayer[],
};

const initialState = {
  ...initialCoreState,
  ...initialLiveState,
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
        setGame: (game) => set({ game }, false, "setGame"),
        setEntry: (entry) => set({ entry }, false, "setEntry"),

        // === LIVE SESSION ACTIONS ===
        setQuestions: (questions, roundBreakSec = 5) =>
          set({ questions, roundBreakSec }, false, "setQuestions"),

        submitAnswer: (questionId, selected, timeMs) =>
          set(
            (state) => {
              const newAnswers = new Map(state.answers);
              newAnswers.set(questionId, {
                questionId,
                selected,
                timeMs,
              });
              return { answers: newAnswers };
            },
            false,
            "submitAnswer"
          ),

        advanceQuestion: () =>
          set(
            (state) => {
              const nextIndex = state.questionIndex + 1;
              if (nextIndex >= state.questions.length) {
                return { isGameComplete: true };
              }

              // Check if round break needed
              const current = state.questions[state.questionIndex];
              const next = state.questions[nextIndex];
              if (current && next && current.roundIndex !== next.roundIndex) {
                return {
                  isBreak: true,
                  timerTarget: Date.now() + state.roundBreakSec * 1000,
                };
              }

              return {
                questionIndex: nextIndex,
                isBreak: false,
                timerTarget: Date.now() + (next?.durationSec ?? 10) * 1000,
              };
            },
            false,
            "advanceQuestion"
          ),

        setQuestionIndex: (index) =>
          set({ questionIndex: index }, false, "setQuestionIndex"),
        setIsBreak: (isBreak) => set({ isBreak }, false, "setIsBreak"),
        setTimerTarget: (target) =>
          set({ timerTarget: target }, false, "setTimerTarget"),
        setGameStarted: (started) =>
          set({ gameStarted: started }, false, "setGameStarted"),
        setGameComplete: (complete) =>
          set({ isGameComplete: complete }, false, "setGameComplete"),

        resetLiveSession: () =>
          set(initialLiveState, false, "resetLiveSession"),

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
              events: [...state.events.slice(-19), event],
            }),
            false,
            "addEvent"
          ),

        setEvents: (events) => set({ events }, false, "setEvents"),

        addReaction: (reaction) =>
          set(
            (state) => ({
              reactions: [...state.reactions.slice(-29), reaction],
            }),
            false,
            "addReaction"
          ),

        addPlayer: (player) =>
          set(
            (state) => {
              const exists = state.recentPlayers.some(
                (p) => p.username === player.username
              );
              if (exists) return state;
              return {
                recentPlayers: [...state.recentPlayers.slice(-19), player],
              };
            },
            false,
            "addPlayer"
          ),

        setRecentPlayers: (players) =>
          set({ recentPlayers: players }, false, "setRecentPlayers"),

        // === SCORE ACTIONS ===
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

        // === RESET ===
        reset: () => set(initialState, false, "reset"),
      }),
      { name: "game-store" }
    )
  );

// ==========================================
// NOTE: All store access should go through GameStoreProvider
// Use useGameStoreContext from game-store-provider.tsx
// ==========================================

// ==========================================
// SELECTORS (for performance)
// ==========================================

export const selectGame = (state: GameState) => state.game;
export const selectEntry = (state: GameState) => state.entry;
export const selectHasEntry = (state: GameState) => state.entry !== null;
export const selectIsConnected = (state: GameState) => state.isConnected;
export const selectOnlineCount = (state: GameState) => state.onlineCount;
export const selectMessages = (state: GameState) => state.messages;
export const selectEvents = (state: GameState) => state.events;
export const selectScore = (state: GameState) => state.entry?.score ?? 0;
export const selectAnswered = (state: GameState) => state.entry?.answered ?? 0;
export const selectReactions = (state: GameState) => state.reactions;
export const selectRecentPlayers = (state: GameState) => state.recentPlayers;

// Live session selectors
export const selectQuestions = (state: GameState) => state.questions;
export const selectAnswers = (state: GameState) => state.answers;
export const selectQuestionIndex = (state: GameState) => state.questionIndex;
export const selectCurrentQuestion = (state: GameState) =>
  state.questions[state.questionIndex] ?? null;
export const selectIsBreak = (state: GameState) => state.isBreak;
export const selectTimerTarget = (state: GameState) => state.timerTarget;
export const selectGameStarted = (state: GameState) => state.gameStarted;
export const selectIsGameComplete = (state: GameState) => state.isGameComplete;
export const selectHasAnswered = (questionId: number) => (state: GameState) =>
  state.answers.has(questionId);
export const selectAnswer = (questionId: number) => (state: GameState) =>
  state.answers.get(questionId);
