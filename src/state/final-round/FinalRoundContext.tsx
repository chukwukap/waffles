"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";

interface Pair {
  id: number;
  originalUrl: string;
  generatedUrl: string;
}

type Status = "idle" | "playing" | "ended";

interface FinalRoundState {
  pairs: Pair[];
  score: number;
  timeLeft: number;
  status: Status;
}

type Action =
  | { type: "SET_PAIRS"; pairs: Pair[] }
  | { type: "SET_STATUS"; status: Status }
  | { type: "DECREMENT_TIMER" }
  | { type: "SET_TIMER"; value: number }
  | { type: "INCREMENT_SCORE"; amount: number }
  | { type: "RESET" };

const initialState: FinalRoundState = {
  pairs: [],
  score: 0,
  timeLeft: 30,
  status: "idle",
};

function reducer(state: FinalRoundState, action: Action): FinalRoundState {
  switch (action.type) {
    case "SET_PAIRS":
      return { ...state, pairs: action.pairs };
    case "SET_STATUS":
      return { ...state, status: action.status };
    case "DECREMENT_TIMER":
      return {
        ...state,
        timeLeft: Math.max(0, state.timeLeft - 1),
        status: state.timeLeft - 1 <= 0 ? "ended" : state.status,
      };
    case "SET_TIMER":
      return { ...state, timeLeft: action.value };
    case "INCREMENT_SCORE":
      return { ...state, score: state.score + action.amount };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

interface FinalRoundContextValue extends FinalRoundState {
  fetchPairs: () => Promise<void>;
  submitMatch: (choiceId: number, targetId: number) => Promise<void>;
  startRound: () => void;
  tick: () => void;
  reset: () => void;
}

const FinalRoundContext =
  createContext<FinalRoundContextValue | undefined>(undefined);

export function FinalRoundProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchPairs = useCallback(async () => {
    try {
      const res = await fetch("/api/final/start");
      if (!res.ok) throw new Error("Failed to load final round pairs");
      const data = await res.json();
      dispatch({ type: "SET_PAIRS", pairs: data.pairs ?? [] });
      dispatch({ type: "SET_STATUS", status: "playing" });
    } catch (error) {
      console.error("final round fetchPairs error:", error);
      dispatch({ type: "RESET" });
    }
  }, []);

  const submitMatch = useCallback(async (choiceId: number, targetId: number) => {
    try {
      const res = await fetch("/api/final/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1,
          gameId: 1,
          choiceId,
          targetId,
        }),
      });
      const payload = await res.json();
      dispatch({
        type: "INCREMENT_SCORE",
        amount: Number(payload.points ?? 0),
      });
    } catch (error) {
      console.error("final round submitMatch error:", error);
    }
  }, []);

  const startRound = useCallback(() => {
    dispatch({ type: "SET_STATUS", status: "playing" });
    dispatch({ type: "SET_TIMER", value: 30 });
  }, []);

  const tick = useCallback(() => {
    dispatch({ type: "DECREMENT_TIMER" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const value = useMemo<FinalRoundContextValue>(
    () => ({
      ...state,
      fetchPairs,
      submitMatch,
      startRound,
      tick,
      reset,
    }),
    [state, fetchPairs, submitMatch, startRound, tick, reset]
  );

  return (
    <FinalRoundContext.Provider value={value}>
      {children}
    </FinalRoundContext.Provider>
  );
}

export function useFinalRound() {
  const context = useContext(FinalRoundContext);
  if (!context) {
    throw new Error("useFinalRound must be used within a FinalRoundProvider");
  }
  return context;
}
