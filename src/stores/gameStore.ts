import { create } from "zustand";

export type GameState =
  | "LOBBY" // Players are waiting for the game to start.
  | "ROUND_COUNTDOWN" // The countdown before a new question is shown.
  | "QUESTION_ACTIVE" // The question is displayed, and players can answer.
  | "ANSWER_SUBMITTED"; // The player has selected an answer and is waiting for the next round.

/**
 * Defines the structure for a single chat message object.
 */
export interface ChatMessage {
  id: string; // Unique identifier for the message.
  username: string; // The name of the user who sent the message.
  avatarUrl?: string; // Optional URL for the user's avatar image.
  timestamp: string; // A formatted string representing when the message was sent (e.g., "13:42").
  message: string; // The content of the chat message.
}

/**
 * Defines the structure for a single multiple-choice answer option.
 */
export interface AnswerOption {
  id: string; // Unique identifier for this answer (e.g., 'a1', 'a2').
  text: string; // The text content of the answer option.
}

/**
 * Defines the structure for a single trivia question.
 */
export interface Question {
  id: string; // Unique identifier for the question.
  questionText: string; // The main text of the question (e.g., "WHO IS THIS?").
  imageUrl: string; // URL for the image associated with the question.
  options: AnswerOption[]; // An array of possible answer options.
  correctAnswerId: string; // The ID of the correct AnswerOption.
}

/**
 * Represents the complete shape of the state managed by the Zustand store.
 */
export interface GameStoreState {
  gameState: GameState; // The current phase of the game.
  roundTimer: number; // Countdown timer value between rounds.
  questionTimer: number; // Countdown timer value for the active question.
  currentQuestion: Question | null; // The currently active question object, or null if none.
  selectedAnswer: string | null; // The ID of the answer selected by the user, or null.
  messages: ChatMessage[]; // An array of all chat messages in the lobby.
  currentQuestionIndex: number; // The index of the current question in the question array.
  totalQuestions: number; // The total number of questions in the game.
}

/**
 * Defines all the actions (functions) that can be called to mutate the game state.
 */
export interface GameStoreActions {
  startGame: () => void;
  selectAnswer: (answerId: string) => void;
  postMessage: (message: { username: string; message: string }) => void;
  tickRoundTimer: () => void;
  tickQuestionTimer: () => void;
  advanceToNextQuestion: () => void;
  resetGame: () => void;
}

/**
 * The final, combined type for the Zustand store, merging the state and actions.
 */
export type GameStore = GameStoreState & GameStoreActions;

// --- MOCK DATA ---
// This data is derived from the UI screenshots to simulate a real game flow.

const MOCK_QUESTIONS: Question[] = [
  {
    id: "q1",
    questionText: "WHAT LOGO IS THIS?",
    imageUrl: "/images/logo.png", // Placeholder for a first question
    options: [{ id: "a1", text: "WAFFLE" }],
    correctAnswerId: "a1",
  },
];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    username: "John",
    message: "Hello, how are you?",
    timestamp: "13:42",
    avatarUrl: "/images/avatars/a.png",
  },
  {
    id: "msg-2",
    username: "thecyberverse",
    message: "Hello, how are you?",
    timestamp: "13:43",
    avatarUrl: "/images/avatars/b.png",
  },
  {
    id: "msg-3",
    username: "cryptoking",
    message: "Hello, how are you?",
    timestamp: "13:44",
    avatarUrl: "/images/avatars/c.png",
  },
  {
    id: "msg-4",
    username: "wafflequeen",
    message: "Hello, how are you?",
    timestamp: "13:45",
    avatarUrl: "/images/avatars/d.png",
  },
  {
    id: "msg-5",
    username: "superman",
    message: "Hello, how are you?",
    timestamp: "13:46",
    avatarUrl: "/images/avatars/a.png",
  },
  {
    id: "msg-6",
    username: "flash",
    message: "Hello, how are you?",
    timestamp: "13:47",
    avatarUrl: "/images/avatars/b.png",
  },
];

// --- INITIAL STATE DEFINITION ---

export const defaultInitialState: GameStoreState = {
  gameState: "LOBBY",
  roundTimer: 15,
  questionTimer: 10,
  currentQuestion: null,
  selectedAnswer: null,
  messages: MOCK_MESSAGES,
  currentQuestionIndex: -1,
  totalQuestions: MOCK_QUESTIONS.length,
};

// --- ZUSTAND STORE CREATION ---

// FIX: Changed the generic from create<GameStoreState> to create<GameStore> to include actions in the store's type.
export const useGameStore = create<GameStore>()((set, get) => ({
  ...defaultInitialState,

  // --- ACTIONS ---

  startGame: () => {
    set({
      gameState: "ROUND_COUNTDOWN",
      roundTimer: 15,
      currentQuestionIndex: -1, // Reset index before starting
      selectedAnswer: null,
      currentQuestion: null,
    });
  },

  selectAnswer: (answerId: string) => {
    if (get().gameState === "QUESTION_ACTIVE") {
      set({ selectedAnswer: answerId, gameState: "ANSWER_SUBMITTED" });

      setTimeout(() => {
        get().advanceToNextQuestion();
      }, 2000);
    }
  },

  // FIX: Explicitly typed the parameters for type safety.
  postMessage: ({
    username,
    message,
  }: {
    username: string;
    message: string;
  }) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      username,
      message,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      avatarUrl: "/avatars/avatar-user.png", // A default avatar for the current user
    };

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  tickRoundTimer: () => {
    const newTime = get().roundTimer - 1;
    if (newTime <= 0) {
      get().advanceToNextQuestion();
    } else {
      set({ roundTimer: newTime });
    }
  },

  tickQuestionTimer: () => {
    const newTime = get().questionTimer - 1;
    if (newTime <= 0) {
      set({ questionTimer: 0, gameState: "ANSWER_SUBMITTED" });
      setTimeout(() => {
        get().advanceToNextQuestion();
      }, 2000);
    } else {
      set({ questionTimer: newTime });
    }
  },

  advanceToNextQuestion: () => {
    const nextIndex = get().currentQuestionIndex + 1;

    if (nextIndex < MOCK_QUESTIONS.length) {
      set({
        currentQuestionIndex: nextIndex,
        currentQuestion: MOCK_QUESTIONS[nextIndex],
        gameState: "QUESTION_ACTIVE",
        questionTimer: 10,
        selectedAnswer: null,
      });
    } else {
      get().resetGame();
    }
  },

  resetGame: () => {
    set({ ...defaultInitialState, gameState: "LOBBY" });
  },
}));
