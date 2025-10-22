import { create } from "zustand";
import { startCountdown } from "@/lib/time";
import SoundManager from "@/lib/SoundManager";
import { INITIAL_ROUND_TIMER } from "@/lib/constants";
import { INITIAL_QUESTION_TIMER } from "@/lib/constants";

interface Question {
  id: number;
  questionText: string;
  imageUrl: string;
  options: string[];
  correctAnswerId: string;
}

type GameStatus =
  | "idle"
  | "playing"
  | "ended"
  | "QUESTION_ACTIVE"
  | "ANSWER_SUBMITTED"
  | "GAME_OVER";

interface GameState {
  round: number;
  current: number;
  questions: Question[];
  timeLeft: number;
  score: number;
  status: GameStatus;
  selectedAnswer: string | null;
  // Actions
  fetchQuestions: () => Promise<void>;
  answerQuestion: (
    questionId: number,
    selected: string,
    timeTaken: number
  ) => Promise<void>;
  nextQuestion: () => void;
  resetGame: () => void;
  // New SoundManager-based/GameActions API
  startGame: () => void;
  tickRoundTimer: () => void;
  selectAnswer: (answerId: string, isCorrect: boolean) => void;
  gameOver: () => void;
  advanceToNextQuestion: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  round: 1,
  current: 0,
  questions: [],
  timeLeft: INITIAL_QUESTION_TIMER,
  score: 0,
  status: "idle",
  selectedAnswer: null,

  fetchQuestions: async () => {
    const res = await fetch("/api/game/start");
    const data = await res.json();
    set({ questions: data.questions, status: "playing" });
    startCountdown(
      INITIAL_QUESTION_TIMER,
      (t) => set({ timeLeft: t }),
      () => get().nextQuestion()
    );
  },

  answerQuestion: async (questionId, selected, timeTaken) => {
    const res = await fetch("/api/game/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: 1, // will be replaced with real fid from auth store
        gameId: 1,
        questionId,
        selected,
        timeTaken,
      }),
    });
    const { correct, points } = await res.json();
    if (correct) set((s) => ({ score: s.score + points }));
  },

  nextQuestion: () => {
    const { current, questions } = get();
    if (current < questions.length - 1) {
      set({ current: current + 1, timeLeft: INITIAL_QUESTION_TIMER });
      startCountdown(
        INITIAL_QUESTION_TIMER,
        (t) => set({ timeLeft: t }),
        () => get().nextQuestion()
      );
    } else {
      set({ status: "ended" });
    }
  },

  resetGame: () =>
    set({
      round: 1,
      current: 0,
      questions: [],
      score: 0,
      status: "idle",
      selectedAnswer: null,
    }),

  // --- SoundManager-based/GameActions API ---
  startGame: () => {
    SoundManager.play("countdown");
    set({
      status: "QUESTION_ACTIVE",
      timeLeft: INITIAL_ROUND_TIMER,
      current: 0,
      score: 0,
      selectedAnswer: null,
      round: 1,
    });
    // Optionally (re)fetch questions, otherwise rely on previous fetchQuestions
    fetch("/api/game/start")
      .then((res) => res.json())
      .then((data) => {
        set({ questions: data.questions });
      });
  },

  tickRoundTimer: () => {
    const newTime = get().timeLeft - 1;
    if (get().status !== "QUESTION_ACTIVE") return;
    if (newTime <= 0) {
      get().selectAnswer("", false); // treat as wrong if time runs out
    } else {
      set({ timeLeft: newTime });
    }
  },

  selectAnswer: (answerId: string, isCorrect: boolean) => {
    if (get().status !== "QUESTION_ACTIVE") return;
    set({ selectedAnswer: answerId, status: "ANSWER_SUBMITTED" });
    SoundManager.play("click");
    SoundManager.play(isCorrect ? "correct" : "wrong");

    // Optionally submit answer asynchronously
    const currentQuestion = get().questions[get().current];
    if (currentQuestion) {
      fetch("/api/game/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1, // Replace with real fid from auth store
          gameId: 1, // Replace with actual if needed
          questionId: currentQuestion.id,
          selected: answerId,
          timeTaken: INITIAL_QUESTION_TIMER - get().timeLeft,
        }),
      })
        .then((res) => res.json())
        .then(({ correct, points }) => {
          if (correct) set((s) => ({ score: s.score + points }));
        })
        .catch(() => {});
    }

    setTimeout(() => {
      get().advanceToNextQuestion();
    }, 2000);
  },

  advanceToNextQuestion: () => {
    const idx = get().current;
    const total = get().questions.length;
    if (idx < total - 1) {
      set({
        current: idx + 1,
        timeLeft: INITIAL_QUESTION_TIMER,
        selectedAnswer: null,
        status: "QUESTION_ACTIVE",
        round: get().round + 1,
      });
    } else {
      get().gameOver();
    }
  },

  gameOver: () => {
    set({ status: "GAME_OVER" });
    SoundManager.play("gameOver");
  },
}));
