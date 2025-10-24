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
  roundBoundaries: number[];

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
  submitAnswer: (params: {
    farcasterId: number;
    selected: string;
    timeTaken: number;
  }) => Promise<{ correct: boolean; points: number } | null>;
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
  roundBoundaries: [],
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

      const game = data as GameWithConfigAndQuestions;
      set({
        game,
        currentQuestionIndex: 0,
        round: 1,
        gameView: "LOBBY",
        selectedAnswer: null,
        roundBoundaries: computeRoundBoundaries(game?.questions?.length ?? 0),
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
      const updated = {
        ...game,
        questions: data.questions,
      } as GameWithConfigAndQuestions;
      set({
        game: updated,
        currentQuestionIndex: 0,
        round: 1,
        roundBoundaries: computeRoundBoundaries(updated.questions?.length ?? 0),
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
      round: 1,
      currentQuestionIndex: 0,
      roundBoundaries: computeRoundBoundaries(game?.questions?.length ?? 0),
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
    const { currentQuestionIndex, game, round, roundBoundaries } = get();
    const total = game?.questions?.length ?? 0;
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= total) {
      get().gameOver();
      return;
    }

    const currentRoundEnd = roundBoundaries[(round - 1) as number] ?? total - 1;
    set({ currentQuestionIndex: nextIndex, selectedAnswer: null });
    SoundManager.play("nextQuestion");
    if (nextIndex > currentRoundEnd) {
      set({ round: round + 1, gameView: "ROUND_COUNTDOWN" });
      setTimeout(() => {
        set({ gameView: "QUESTION_ACTIVE" });
      }, 3000);
    } else {
      set({ gameView: "QUESTION_ACTIVE" });
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
      roundBoundaries: [],
      // _chatChannel: null,
    });
  },

  gameOver: () => {
    // get().unsubscribeFromChat();
    set({ gameView: "GAME_OVER" });
    SoundManager.play("gameOver");
  },
}));

// Split questions into 3 roughly equal rounds
function computeRoundBoundaries(total: number): number[] {
  if (total <= 0) return [];
  const per = Math.ceil(total / 3);
  const r1End = Math.min(total - 1, per - 1);
  const r2End = Math.min(total - 1, r1End + per);
  const r3End = total - 1;
  return [r1End, r2End, r3End];
}
