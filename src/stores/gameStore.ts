// ───────────────────────── src/stores/gameStore.ts ─────────────────────────
"use client";

import { create } from "zustand";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import SoundManager from "@/lib/SoundManager";

export interface User {
  fid: number;
  username: string;
  pfpUrl: string;
}

// ───────────────────────── TYPES ─────────────────────────
export interface ChatMessage {
  id: number;
  username: string;
  message: string;
  avatarUrl: string;
  time: string;
}

export interface ChatApiResponse {
  messageId: number;
  userId: number;
  userName: string | null;
  message: string;
  createdAt: string;
  avatarUrl?: string | null;
}

export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: number;
  questionText: string;
  imageUrl: string;
  options: AnswerOption[];
  correctAnswerId?: string;
}

export type GameState =
  | "LOBBY"
  | "ROUND_COUNTDOWN"
  | "QUESTION_ACTIVE"
  | "ANSWER_SUBMITTED"
  | "GAME_OVER";

export interface GameStore {
  gameId: number | null;
  gameState: GameState;
  round: number;
  current: number;
  questions: Question[];
  timeLeft: number;
  score: number;
  selectedAnswer: string | null;
  visualCue: "none" | "correct" | "wrong";

  // Derived
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  questionTimer: number;
  roundTimer: number;

  // Chat
  messages: ChatMessage[];
  fetchMessages: (gameId: number, user: User) => Promise<void>;
  sendMessage: (text: string, user: User) => Promise<void>;

  // Realtime
  subscribeToChat: (gameId: number) => void;
  unsubscribeFromChat: () => void;

  // Game flow
  fetchQuestions: (gameId: number, user: User) => Promise<void>;
  startRoundCountdown: () => void;
  tickRoundTimer: () => void;
  selectAnswer: (answerId: string) => void;
  advanceToNextQuestion: () => void;
  resetGame: () => void;
  gameOver: () => void;

  _chatChannel?: RealtimeChannel | null;
}

// ───────────────────────── CONSTANTS ─────────────────────────
const QUESTION_DURATION = 15;

// ───────────────────────── STORE ─────────────────────────
export const useGameStore = create<GameStore>((set, get) => ({
  gameId: null,
  gameState: "LOBBY",
  round: 1,
  current: 0,
  questions: [],
  timeLeft: QUESTION_DURATION,
  score: 0,
  selectedAnswer: null,
  visualCue: "none",
  messages: [],
  _chatChannel: null,

  // Derived fields
  get currentQuestion() {
    const { questions, current } = get();
    return questions[current] ?? null;
  },
  get currentQuestionIndex() {
    return get().current;
  },
  get totalQuestions() {
    return get().questions.length;
  },
  get questionTimer() {
    return get().timeLeft;
  },
  get roundTimer() {
    return get().timeLeft;
  },

  // ───────── Chat Logic ─────────
  fetchMessages: async (
    gameId: number,
    user: { fid: number; username: string; pfpUrl: string }
  ) => {
    try {
      const res = await fetch(`/api/chat?gameId=${gameId}`, {
        headers: { "x-farcaster-id": String(user.fid) },
      });
      if (!res.ok) throw new Error("Failed to fetch chat");
      const data: ChatApiResponse[] = await res.json();

      const formatted: ChatMessage[] = data.map((m) => ({
        id: m.messageId,
        username: user.username,
        message: m.message,
        avatarUrl: user.pfpUrl,
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      set({ messages: formatted });
    } catch (err) {
      console.error("fetchMessages error:", err);
    }
  },

  sendMessage: async (text: string, user: User) => {
    const { gameId, messages } = get();
    if (!user.fid || !gameId) {
      console.error("No Farcaster ID or game ID found");
      return;
    }

    try {
      const temp: ChatMessage = {
        id: Date.now(),
        username: user.username,
        message: text,
        avatarUrl: user.pfpUrl,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      set({ messages: [...messages, temp] });

      await fetch(`/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-farcaster-id": String(user.fid),
        },
        body: JSON.stringify({ gameId, message: text }),
      });
    } catch (err) {
      console.error("sendMessage error:", err);
    }
  },

  // ───────── Realtime Chat ─────────
  subscribeToChat: (gameId: number) => {
    const store = get();
    if (store._chatChannel) {
      store._chatChannel.unsubscribe();
      set({ _chatChannel: null });
    }

    const channel = supabase
      .channel(`chat_game_${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Chat",
          filter: `gameId=eq.${gameId}`,
        },
        (payload) => {
          const msg = payload.new as {
            id: number;
            message: string;
            createdAt: string;
          };
          set((s) => ({
            messages: [
              ...s.messages,
              {
                id: msg.id,
                username: "Player",
                message: msg.message,
                avatarUrl: "/images/avatars/default.png",
                time: new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ],
          }));
        }
      )
      .subscribe();

    // ✅ Cleanup automatically when tab closes
    const cleanup = () => {
      channel.unsubscribe();
      set({ _chatChannel: null });
      window.removeEventListener("beforeunload", cleanup);
    };
    window.addEventListener("beforeunload", cleanup);

    set({ _chatChannel: channel });
  },

  unsubscribeFromChat: () => {
    const { _chatChannel } = get();
    if (_chatChannel) {
      _chatChannel.unsubscribe();
      set({ _chatChannel: null });
    }
  },

  // ───────── Game Logic ─────────
  fetchQuestions: async (gameId: number, user: User) => {
    if (!gameId) {
      console.warn("fetchQuestions called without a gameId");
      return;
    }
    try {
      const res = await fetch(`/api/games/${gameId}`);
      const data = await res.json();
      set({
        questions: data.questions || [],
        gameId,
        current: 0,
        gameState: "LOBBY",
        messages: [],
      });
      await get().fetchMessages(gameId, user);
      get().subscribeToChat(gameId);
    } catch (e) {
      console.error("Failed to fetch questions:", e);
    }
  },

  startRoundCountdown: () => {
    SoundManager.play("countdown");
    set({ gameState: "ROUND_COUNTDOWN" });
    setTimeout(() => {
      set({
        gameState: "QUESTION_ACTIVE",
        timeLeft: QUESTION_DURATION,
        selectedAnswer: null,
        visualCue: "none",
      });
    }, 3000);
  },

  tickRoundTimer: () => {
    const { gameState, timeLeft } = get();
    if (gameState !== "QUESTION_ACTIVE") return;
    if (timeLeft <= 1) get().selectAnswer("");
    else set({ timeLeft: timeLeft - 1 });
  },

  selectAnswer: (answerId: string) => {
    const { current, questions, timeLeft, score, gameState } = get();
    if (gameState !== "QUESTION_ACTIVE") return;

    const q = questions[current];
    const isCorrect = q?.correctAnswerId
      ? q.correctAnswerId === answerId
      : Math.random() > 0.5;

    set({
      selectedAnswer: answerId,
      gameState: "ANSWER_SUBMITTED",
      visualCue: isCorrect ? "correct" : "wrong",
    });

    SoundManager.play("click");
    SoundManager.play(isCorrect ? "correct" : "wrong");

    if (q) {
      fetch("/api/game/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1,
          gameId: get().gameId,
          questionId: q.id,
          selected: answerId,
          timeTaken: QUESTION_DURATION - timeLeft,
        }),
      })
        .then((r) => r.json())
        .then(({ correct, points }: { correct: boolean; points: number }) => {
          if (correct) set({ score: score + (points || 0) });
        })
        .catch(console.error);
    }

    setTimeout(() => {
      set({ visualCue: "none" });
      get().advanceToNextQuestion();
    }, 1800);
  },

  advanceToNextQuestion: () => {
    const { current, questions } = get();
    if (current < questions.length - 1) {
      set({
        current: current + 1,
        timeLeft: QUESTION_DURATION,
        selectedAnswer: null,
      });
      SoundManager.play("nextQuestion");
      get().startRoundCountdown();
    } else get().gameOver();
  },

  resetGame: () => {
    get().unsubscribeFromChat();
    set({
      round: 1,
      current: 0,
      questions: [],
      score: 0,
      gameState: "LOBBY",
      selectedAnswer: null,
      visualCue: "none",
      timeLeft: QUESTION_DURATION,
      messages: [],
      gameId: null,
      _chatChannel: null,
    });
  },

  gameOver: () => {
    get().unsubscribeFromChat();
    set({ gameState: "GAME_OVER", messages: [] });
    SoundManager.play("gameOver");
  },
}));
