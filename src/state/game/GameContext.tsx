"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
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
  | "FINAL_COUNTDOWN"
  | "ROUND_COUNTDOWN"
  | "QUESTION_ACTIVE"
  | "ANSWER_SUBMITTED"
  | "GAME_OVER"
  | "PAUSED";

interface GameState {
  status: "idle" | "loading" | "ready" | "error";
  error?: string | null;
  game: GameWithConfigAndQuestions | null;
  questionIndex: number;
  round: number;
  view: GameView;
  selectedAnswer: string | null;
  messages: ChatWithUser[];
  roundBoundaries: number[];
}

type GameAction =
  | { type: "RESET" }
  | { type: "SET_LOADING" }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_GAME"; game: GameWithConfigAndQuestions | null }
  | { type: "SET_VIEW"; view: GameView }
  | { type: "SET_SELECTED"; answer: string | null }
  | { type: "SET_MESSAGES"; messages: ChatWithUser[] }
  | { type: "ADD_MESSAGE"; message: ChatWithUser }
  | { type: "ADVANCE_QUESTION" }
  | { type: "SET_ROUND_COUNTDOWN" }
  | { type: "SET_ROUND_ACTIVE" }
  | { type: "SET_ROUND"; round: number }
  | { type: "SET_QUESTION_INDEX"; index: number }
  | { type: "SET_ROUND_BOUNDARIES"; boundaries: number[] };

const initialState: GameState = {
  status: "idle",
  error: null,
  game: null,
  questionIndex: 0,
  round: 1,
  view: "LOBBY",
  selectedAnswer: null,
  messages: [],
  roundBoundaries: [],
};

function computeRoundBoundaries(total: number): number[] {
  if (total <= 0) return [];
  const per = Math.ceil(total / 3);
  const r1End = Math.min(total - 1, per - 1);
  const r2End = Math.min(total - 1, r1End + per);
  const r3End = total - 1;
  return [r1End, r2End, r3End];
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "RESET":
      return { ...initialState };
    case "SET_LOADING":
      return { ...state, status: "loading", error: null };
    case "SET_ERROR":
      return {
        ...state,
        status: action.error ? "error" : state.status,
        error: action.error,
      };
    case "SET_GAME": {
      const game = action.game;
      const boundaries = computeRoundBoundaries(game?.questions?.length ?? 0);
      return {
        ...state,
        status: game ? "ready" : "idle",
        game,
        questionIndex: 0,
        round: 1,
        view: "LOBBY",
        selectedAnswer: null,
        roundBoundaries: boundaries,
        error: null,
      };
    }
    case "SET_VIEW":
      return { ...state, view: action.view };
    case "SET_SELECTED":
      return { ...state, selectedAnswer: action.answer };
    case "SET_MESSAGES":
      return { ...state, messages: action.messages };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "SET_ROUND_BOUNDARIES":
      return { ...state, roundBoundaries: action.boundaries };
    case "SET_ROUND":
      return { ...state, round: action.round };
    case "SET_QUESTION_INDEX":
      return { ...state, questionIndex: action.index };
    case "SET_ROUND_COUNTDOWN":
      return { ...state, view: "ROUND_COUNTDOWN", selectedAnswer: null };
    case "SET_ROUND_ACTIVE":
      return { ...state, view: "QUESTION_ACTIVE", selectedAnswer: null };
    case "ADVANCE_QUESTION": {
      const total = state.game?.questions?.length ?? 0;
      const next = state.questionIndex + 1;
      const capped = Math.min(next, Math.max(total - 1, 0));
      return {
        ...state,
        questionIndex: next >= total ? state.questionIndex : capped,
        selectedAnswer: null,
      };
    }
    default:
      return state;
  }
}

interface GameContextValue extends GameState {
  loadActiveGame: () => Promise<void>;
  loadQuestions: () => Promise<void>;
  submitAnswer: (args: {
    farcasterId: number;
    selected: string;
    timeTaken: number;
  }) => Promise<{ correct: boolean; points: number } | null>;
  selectAnswer: (answer: string) => void;
  advanceToNextQuestion: () => void;
  setView: (view: GameView) => void;
  resetGame: () => void;
  fetchMessages: () => Promise<void>;
  setMessages: (messages: ChatWithUser[]) => void;
  sendMessage: (
    text: string,
    user: { fid: number; username: string; pfpUrl: string }
  ) => Promise<void>;
  gameOver: () => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearAdvanceTimer(), [clearAdvanceTimer]);

  const loadActiveGame = useCallback(async () => {
    dispatch({ type: "SET_LOADING" });
    try {
      const res = await fetch(`/api/game/active`);
      if (!res.ok) throw new Error("Failed to load active game");
      const data = (await res.json()) as GameWithConfigAndQuestions;
      dispatch({ type: "SET_GAME", game: data });
      dispatch({
        type: "SET_ROUND_BOUNDARIES",
        boundaries: computeRoundBoundaries(data?.questions?.length ?? 0),
      });
    } catch (error) {
      console.error("loadActiveGame error", error);
      dispatch({
        type: "SET_ERROR",
        error: error instanceof Error ? error.message : "Failed to load game",
      });
      dispatch({ type: "SET_GAME", game: null });
      throw error;
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    const gameId = state.game?.id;
    if (!gameId) return;
    try {
      const res = await fetch(`/api/game/${gameId}/questions`);
      if (!res.ok) throw new Error("Failed to load questions");
      const data = await res.json();
      const updated = {
        ...state.game!,
        questions: data.questions,
      } as GameWithConfigAndQuestions;
      dispatch({ type: "SET_GAME", game: updated });
      dispatch({
        type: "SET_ROUND_BOUNDARIES",
        boundaries: computeRoundBoundaries(updated.questions?.length ?? 0),
      });
    } catch (error) {
      console.error("loadQuestions error", error);
      dispatch({
        type: "SET_ERROR",
        error:
          error instanceof Error ? error.message : "Failed to load questions",
      });
      throw error;
    }
  }, [state.game]);

  const submitAnswer = useCallback(
    async ({
      farcasterId,
      selected,
      timeTaken,
    }: {
      farcasterId: number;
      selected: string;
      timeTaken: number;
    }) => {
      const game = state.game;
      if (!game?.id) return null;
      const question = game.questions?.[state.questionIndex];
      if (!question) return null;

      try {
        const res = await fetch(`/api/game/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            farcasterId,
            gameId: game.id,
            questionId: question.id,
            selected,
            timeTaken,
          }),
        });
        if (!res.ok) throw new Error("Failed to submit answer");
        return (await res.json()) as { correct: boolean; points: number };
      } catch (error) {
        console.error("submitAnswer error", error);
        dispatch({
          type: "SET_ERROR",
          error:
            error instanceof Error ? error.message : "Failed to submit answer",
        });
        return null;
      }
    },
    [state.game, state.questionIndex]
  );

  const determineRoundForIndex = useCallback(
    (index: number) => {
      const boundaries = state.roundBoundaries;
      if (!boundaries.length) return 1;
      for (let i = 0; i < boundaries.length; i += 1) {
        if (index <= boundaries[i]) {
          return i + 1;
        }
      }
      return boundaries.length;
    },
    [state.roundBoundaries]
  );

  const gameOver = useCallback(() => {
    dispatch({ type: "SET_VIEW", view: "GAME_OVER" });
    if (state.game?.config?.soundEnabled) {
      SoundManager.play("gameOver");
    }
    clearAdvanceTimer();
  }, [state.game?.config?.soundEnabled, clearAdvanceTimer]);

  const advanceToNextQuestion = useCallback(() => {
    const total = state.game?.questions?.length ?? 0;
    if (!total) return;
    const nextIndex = state.questionIndex + 1;
    if (nextIndex >= total) {
      gameOver();
      return;
    }

    const previousRound = determineRoundForIndex(state.questionIndex);
    const nextRound = determineRoundForIndex(nextIndex);

    dispatch({ type: "SET_QUESTION_INDEX", index: nextIndex });
    dispatch({ type: "SET_SELECTED", answer: null });
    dispatch({ type: "SET_ROUND", round: nextRound });
    if (state.game?.config?.soundEnabled) {
      SoundManager.play("nextQuestion");
    }
    if (nextRound > previousRound) {
      dispatch({ type: "SET_ROUND_COUNTDOWN" });
    } else {
      dispatch({ type: "SET_ROUND_ACTIVE" });
    }
  }, [
    determineRoundForIndex,
    gameOver,
    state.game?.config?.soundEnabled,
    state.game?.questions?.length,
    state.questionIndex,
  ]);

  const selectAnswer = useCallback(
    (answer: string) => {
      const question =
        state.game?.questions?.[state.questionIndex]?.correctAnswer;
      dispatch({ type: "SET_SELECTED", answer });
      dispatch({ type: "SET_VIEW", view: "ANSWER_SUBMITTED" });

      if (state.game?.config?.soundEnabled) {
        SoundManager.play("click");
        SoundManager.play(question === answer ? "correct" : "wrong");
      }

      clearAdvanceTimer();
      advanceTimerRef.current = setTimeout(() => {
        advanceToNextQuestion();
      }, 1500);
    },
    [
      advanceToNextQuestion,
      clearAdvanceTimer,
      state.game?.config?.soundEnabled,
      state.game?.questions,
      state.questionIndex,
    ]
  );

  const setView = useCallback((view: GameView) => {
    dispatch({ type: "SET_VIEW", view });
  }, []);

  const resetGame = useCallback(() => {
    clearAdvanceTimer();
    SoundManager.stopAll();
    dispatch({ type: "RESET" });
  }, [clearAdvanceTimer]);

  const fetchMessages = useCallback(async () => {
    const game = state.game;
    if (!game?.id) return;
    try {
      const res = await fetch(`/api/chat?gameId=${game.id}`);
      if (!res.ok) throw new Error("Failed to fetch chat");
      const data: ChatWithUser[] = await res.json();
      dispatch({ type: "SET_MESSAGES", messages: data });
    } catch (error) {
      console.error("fetchMessages error:", error);
      dispatch({ type: "SET_MESSAGES", messages: [] });
    }
  }, [state.game]);

  const setMessages = useCallback((messages: ChatWithUser[]) => {
    dispatch({ type: "SET_MESSAGES", messages });
  }, []);

  const sendMessage = useCallback(
    async (
      text: string,
      user: { fid: number; username: string; pfpUrl: string }
    ) => {
      const game = state.game;
      if (!game?.id) return;

      const optimistic: ChatWithUser = {
        id: Date.now(),
        gameId: game.id,
        userId: 0,
        user: {
          name: user.username || "You",
          imageUrl: user.pfpUrl || null,
        },
        message: text,
        createdAt: new Date(),
      };

      dispatch({ type: "ADD_MESSAGE", message: optimistic });

      if (!user.fid) return;
      try {
        await fetch(`/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-farcaster-id": String(user.fid),
          },
          body: JSON.stringify({
            gameId: game.id,
            message: text,
          }),
        });
      } catch (error) {
        console.error("sendMessage error:", error);
      }
    },
    [state.game]
  );

  const value = useMemo<GameContextValue>(
    () => ({
      ...state,
      loadActiveGame,
      loadQuestions,
      submitAnswer,
      selectAnswer,
      advanceToNextQuestion,
      setView,
      resetGame,
      fetchMessages,
      setMessages,
      sendMessage,
      gameOver,
    }),
    [
      state,
      loadActiveGame,
      loadQuestions,
      submitAnswer,
      selectAnswer,
      advanceToNextQuestion,
      setView,
      resetGame,
      fetchMessages,
      setMessages,
      sendMessage,
      gameOver,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameStateProvider");
  }
  return context;
}
