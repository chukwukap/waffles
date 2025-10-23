// ───────────────────────── src/stores/gameStore.ts ─────────────────────────
"use client";

import { create } from "zustand";
// import { RealtimeChannel } from "@supabase/supabase-js";
// import { supabase } from "@/lib/supabaseClient";
import SoundManager from "@/lib/SoundManager";
import { GameWithConfigAndQuestions } from "@/lib/server/game";
import { Prisma } from "@prisma/client";

export type ChatWithUser = Prisma.ChatGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        imageUrl: true;
      };
    };
  };
}>;

export type GameView =
  | "LOBBY"
  | "ROUND_COUNTDOWN"
  | "QUESTION_ACTIVE"
  | "ANSWER_SUBMITTED"
  | "GAME_OVER"
  | "PAUSED";

// ───────────────────────── STORE INTERFACE ─────────────────────────
export interface GameStore {
  game: GameWithConfigAndQuestions | null;
  currentQuestionIndex: number;
  round: number;
  gameView: GameView;
  selectedAnswer: string | null;

  // Chat
  messages: ChatWithUser[];
  fetchMessages: () => Promise<void>;
  sendMessage: (
    text: string,
    user: { fid: number; username: string; pfpUrl: string }
  ) => Promise<void>;

  // Game flow
  fetchActiveGame: () => Promise<void>;
  fetchQuestions: () => Promise<void>;
  submitAnswer: (params: { farcasterId: number; selected: string; timeTaken: number }) => Promise<{ correct: boolean; points: number } | null>;
  setGame: (game: GameWithConfigAndQuestions) => void;
  setGameView: (gameView: GameView) => void;
  selectAnswer: (answer: string) => void;
  advanceToNextQuestion: () => void;
  resetGame: () => void;
  gameOver: () => void;

  // Internal
  // _chatChannel?: RealtimeChannel | null;
}

// ───────────────────────── CONSTANTS ─────────────────────────

// ───────────────────────── STORE ─────────────────────────
export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  currentQuestionIndex: 0,
  round: 1,
  gameView: "LOBBY",
  selectedAnswer: null,
  messages: [],
  // _chatChannel: null,

  // ───────── Chat Logic ─────────
  fetchMessages: async () => {
    const { game } = get();
    try {
      if (!game?.id) return;
      const res = await fetch(`/api/chat?gameId=${game.id}`);
      if (!res.ok) throw new Error("Failed to fetch chat");
      const data: ChatWithUser[] = await res.json();
      set({ messages: data });
    } catch (err) {
      console.error("fetchMessages error:", err);
      set({ messages: [] });
    }
  },

  sendMessage: async (text, user) => {
    const { game, messages } = get();
    if (!user?.fid || !game?.id) return;

    const tempMsg: ChatWithUser = {
      id: Date.now(),
      gameId: game.id,
      userId: 0, // Note: Not used in backend, but required by Prisma,
      user: {
        name: user.username,
        imageUrl: user.pfpUrl,
      },
      message: text,
      createdAt: new Date(),
    };

    set({ messages: [...messages, tempMsg as ChatWithUser] });

    try {
      await fetch(`/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          farcasterId: String(user.fid),
          message: text,
        }),
      });
    } catch (err) {
      console.error("sendMessage error:", err);
    }
  },

  // subscribeToChat: (gameId) => {
  //   const { _chatChannel } = get();
  //   if (_chatChannel) {
  //     _chatChannel.unsubscribe();
  //     set({ _chatChannel: null });
  //   }

  //   const channel = supabase
  //     .channel(`chat_game_${gameId}`)
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "INSERT",
  //         schema: "public",
  //         table: "Chat",
  //         filter: `gameId=eq.${gameId}`,
  //       },
  //       (payload) => {
  //         const m: any = payload.new;
  //         set((s) => ({
  //           messages: [
  //             ...s.messages,
  //             {
  //               id: m.id,
  //               username: m.username ?? "Player",
  //               message: m.message,
  //               avatarUrl: m.avatarUrl ?? "/images/avatars/default.png",
  //               time: new Date(m.createdAt).toLocaleTimeString([], {
  //                 hour: "2-digit",
  //                 minute: "2-digit",
  //               }),
  //             },
  //           ],
  //         }));
  //       }
  //     )
  //     .subscribe();

  //   const cleanup = () => {
  //     channel.unsubscribe();
  //     set({ _chatChannel: null });
  //   };
  //   window.addEventListener("beforeunload", cleanup);

  //   set({ _chatChannel: channel });
  // },

  // unsubscribeFromChat: () => {
  //   const { _chatChannel } = get();
  //   if (_chatChannel) {
  //     _chatChannel.unsubscribe();
  //     set({ _chatChannel: null });
  //   }
  // },

  // ───────── Fetch Active Game ─────────
  fetchActiveGame: async () => {
    try {
      const res = await fetch(`/api/game/active`);
      if (!res.ok) throw new Error("No active game found");
      const data = await res.json();
      console.log("fetchActiveGame data:", data);

      set({
        game: data as GameWithConfigAndQuestions,
        currentQuestionIndex: 0,
        round: 1,
        gameView: "LOBBY",
        selectedAnswer: null,
      });
    } catch (err) {
      console.error("fetchActiveGame error:", err);
    }
  },

  // ───────── Questions ─────────
  fetchQuestions: async () => {
    const { game } = get();
    if (!game?.id) return;
    try {
      const res = await fetch(`/api/game/${game.id}/questions`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      set({
        game: { ...game, questions: data.questions },
        currentQuestionIndex: 0,
      });
    } catch (e) {
      console.error("fetchQuestions error:", e);
    }
  },

  // ───────── Submit Answer ─────────
  submitAnswer: async ({ farcasterId, selected, timeTaken }) => {
    const { game, currentQuestionIndex } = get();
    const q = game?.questions?.[currentQuestionIndex];
    if (!game?.id || !q) return null;
    try {
      const res = await fetch(`/api/game/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farcasterId,
          gameId: game.id,
          questionId: q.id,
          selected,
          timeTaken,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      return (await res.json()) as { correct: boolean; points: number };
    } catch (e) {
      console.error("submitAnswer error:", e);
      return null;
    }
  },

  // ───────── Set Game (SSR hydration) ─────────
  setGame: (game) => {
    set({
      game,
    });
  },

  setGameView: (gameView: GameView) => {
    set({ gameView });
  },

  selectAnswer: (answer: string) => {
    const { currentQuestionIndex, game } = get();
    const q = game?.questions?.[currentQuestionIndex];
    if (!q) return;

    const isCorrect = q.correctAnswer === answer;

    set({
      selectedAnswer: answer,
      gameView: "ANSWER_SUBMITTED",
    });

    if (game?.config?.soundEnabled) {
      SoundManager.play("click");
      SoundManager.play(isCorrect ? "correct" : "wrong");
    }

    setTimeout(() => {
      get().advanceToNextQuestion();
    }, 1500);
  },

  advanceToNextQuestion: () => {
    const { currentQuestionIndex, game } = get();
    const total = game?.questions?.length ?? 0;

    if (currentQuestionIndex < total - 1) {
      set({
        currentQuestionIndex: currentQuestionIndex + 1,
        selectedAnswer: null,
      });
      SoundManager.play("nextQuestion");
    } else {
      get().gameOver();
    }
  },

  resetGame: () => {
    // get().unsubscribeFromChat();
    set({
      game: null,
      currentQuestionIndex: 0,
      round: 1,
      selectedAnswer: null,
      gameView: "LOBBY",
      messages: [],
      // _chatChannel: null,
    });
  },

  gameOver: () => {
    // get().unsubscribeFromChat();
    set({ gameView: "GAME_OVER" });
    SoundManager.play("gameOver");
  },
}));
