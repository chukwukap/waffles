import { create } from "zustand";

import { submitAnswerAction, SubmitAnswerResult } from "@/actions/game";
import { sendMessageAction, SendMessageResult } from "@/actions/chat";

import { getOrCreateReferralCodeAction } from "@/actions/invite";

import type {
  GameStateType,
  ChatWithUser,
  Ticket,
  ReferralCode,
  InvitedBy,
  GameHistoryEntry,
  AllTimeStats,
  HydratedGame,
} from "./types";

import SoundManager from "@/lib/SoundManager";
import { notify } from "@/components/ui/Toaster";
import { updateProfileAction, UpdateProfileResult } from "@/actions/profile";

function computeRoundBoundaries(totalQuestions: number): number[] {
  if (totalQuestions <= 0) return [];
  const questionsPerRound = Math.ceil(totalQuestions / 3);
  const r1End = Math.min(totalQuestions - 1, questionsPerRound - 1);
  const r2End = Math.min(totalQuestions - 1, r1End + questionsPerRound);
  const r3End = totalQuestions - 1;
  return [r1End, r2End, r3End];
}

interface GameSliceState {
  activeGame: HydratedGame | null;
  questionIndex: number;
  round: number;
  gameState: GameStateType;
  selectedAnswer: string | null;
  messages: ChatWithUser[];
  roundBoundaries: number[];
}
interface GameSliceActions {
  hydrateInitialGame: (game: HydratedGame) => void;
  setGameState: (state: GameStateType) => void;
  setSelectedAnswer: (answer: string | null) => void;
  advanceToNextQuestion: () => void;
  submitAnswer: (args: {
    fid: number;
    selected: string | null;
    timeTaken: number;
  }) => Promise<SubmitAnswerResult>;
  setMessages: (messages: ChatWithUser[]) => void;
  addOptimisticMessage: (message: ChatWithUser) => void;
  removeOptimisticMessage: (id: number) => void;
  sendMessage: (
    text: string,
    user: {
      fid: number;
      username: string;
      pfpUrl: string | null;
    }
  ) => Promise<SendMessageResult>;
  gameOver: () => void;
  resetGame: () => void;
}
export type GameSlice = GameSliceState & GameSliceActions;

interface LobbySliceState {
  ticket: Ticket | null;
  myReferral: ReferralCode | null;
  invitedBy: InvitedBy | null;
  hasValidInvite: boolean;
  inviteStatusLoaded: boolean;
  lobbyLoading: boolean;
  lobbyError: string | null;
}
interface LobbySliceActions {
  setTicket: (ticket: Ticket | null) => void;
  setMyReferral: (referral: ReferralCode | null) => void;
  setInvitedBy: (invitedBy: InvitedBy | null) => void;
  setHasValidInvite: (isValid: boolean) => void;
  setInviteStatusLoaded: (isLoaded: boolean) => void;
  fetchTicket: (fid: string, gameId: number) => Promise<Ticket | null>;
  fetchReferralStatus: (fidString: string) => Promise<void>;
  fetchMyReferralCode: (fidString: string) => Promise<void>;
}
export type LobbySlice = LobbySliceState & LobbySliceActions;

// --- Profile Slice ---
interface ProfileSliceState {
  fid: number | null;
  username: string | null;
  wallet: string | null;
  imageUrl: string | null;
  streak: number;
  profileSummaryStats: { games: number; wins: number; winnings: number };
  allTimeStats: AllTimeStats;
  gameHistory: GameHistoryEntry[];
  profileLoading: boolean;
  hasLoadedProfile: boolean;
  profileError: string | null;
}
interface ProfileSliceActions {
  setProfileData: (
    data: Partial<ProfileSliceState & { myReferral?: ReferralCode | null }>
  ) => void;
  resetProfile: () => void;
  updateProfile: (input: {
    fid: string;
    name?: string | null;
    wallet?: string | null;
    imageUrl?: string | null;
  }) => Promise<UpdateProfileResult>;
}
export type ProfileSlice = ProfileSliceState & ProfileSliceActions;

export type AppState = GameSlice & LobbySlice & ProfileSlice;

const initialGameSliceState: GameSliceState = {
  activeGame: null,
  questionIndex: 0,
  round: 1,
  gameState: "WAITING",
  selectedAnswer: null,
  messages: [],
  roundBoundaries: [],
};
const initialLobbySliceState: LobbySliceState = {
  ticket: null,
  myReferral: null,
  invitedBy: null,
  hasValidInvite: false,
  inviteStatusLoaded: false,
  lobbyLoading: false,
  lobbyError: null,
};
const initialProfileSliceState: ProfileSliceState = {
  fid: null,
  username: null,
  wallet: null,
  imageUrl: null,
  streak: 0,
  profileSummaryStats: { games: 0, wins: 0, winnings: 0 },
  allTimeStats: {
    totalGames: 0,
    wins: 0,
    winRate: "0%",
    totalWon: "$0.00",
    highestScore: 0,
    averageScore: 0,
    currentStreak: 0,
    bestRank: null,
  },
  gameHistory: [],
  profileLoading: false,
  hasLoadedProfile: false,
  profileError: null,
};

export const useAppStore = create<AppState>()((set, get) => ({
  ...initialGameSliceState,
  ...initialLobbySliceState,
  ...initialProfileSliceState,

  hydrateInitialGame: (game) => {
    if (!game) return;
    const boundaries = computeRoundBoundaries(game.questions?.length ?? 0);
    set((state) => ({
      ...state,
      activeGame: game,
      questionIndex: 0,
      round: 1,
      gameState: "WAITING",
      selectedAnswer: null,
      roundBoundaries: boundaries,
      messages: [],
      profileError: null,
      lobbyError: null,
    }));
    console.log("Store hydrated with game:", game.id);
  },
  setGameState: (newState) => {
    set((state) => ({
      ...state,
      gameState: newState,
    }));
  },
  setSelectedAnswer: (answer) => {
    set((state) => ({
      ...state,
      selectedAnswer: answer,
    }));
  },
  advanceToNextQuestion: () => {
    const { activeGame, questionIndex, roundBoundaries, round, gameOver } =
      get();
    if (!activeGame) return;
    const totalQuestions = activeGame.questions?.length ?? 0;
    const nextIndex = questionIndex + 1;

    if (nextIndex >= totalQuestions) {
      gameOver();
      return;
    }

    const currentRound = round;
    let nextRound = currentRound;
    // Check if the *current* index is the last index of the current round
    if (
      roundBoundaries.length >= currentRound &&
      questionIndex === roundBoundaries[currentRound - 1]
    ) {
      nextRound = currentRound + 1;
    }

    set((state) => ({
      ...state,
      questionIndex: nextIndex,
      selectedAnswer: null,
      round: nextRound,
      gameState:
        nextRound > currentRound
          ? "GAME_LIVE_ROUND_COUNTDOWN" // Trigger round countdown if round changed
          : "GAME_LIVE", // Otherwise, go straight to next question
    }));
    if (activeGame.config?.soundEnabled) SoundManager.play("nextQuestion");
  },
  submitAnswer: async (args) => {
    const { activeGame, questionIndex } = get();
    if (!activeGame?.id || !activeGame.questions?.[questionIndex]?.id) {
      const errorMsg = "Cannot submit answer: Missing game context.";
      notify.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const serverActionInput = {
      fid: args.fid,
      gameId: activeGame.id,
      questionId: activeGame.questions[questionIndex].id,
      selected: args.selected,
      timeTaken: args.timeTaken,
    };

    try {
      const result = await submitAnswerAction(serverActionInput);

      if (result.success && activeGame.config?.soundEnabled) {
        SoundManager.play(result.correct ? "correct" : "wrong");
      } else if (!result.success) {
        notify.error(`Submission failed: ${result.error}`);
      }
      return result;
    } catch (error) {
      console.error("Error calling submitAnswerAction:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Network error.";
      notify.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },
  setMessages: (messages) => {
    set((state) => ({
      ...state,
      messages,
    }));
  },
  addOptimisticMessage: (message) => {
    set((state) => ({
      ...state,
      messages: [...state.messages, message],
    }));
  },
  removeOptimisticMessage: (tempId) => {
    set((state) => ({
      ...state,
      messages: state.messages.filter((m: ChatWithUser) => m.id !== tempId),
    }));
  },
  sendMessage: async (text, user) => {
    const { activeGame, addOptimisticMessage, removeOptimisticMessage } = get();
    if (!activeGame?.id || !user.fid) {
      return { success: false, error: "Missing game or user FID." };
    }

    const optimisticMsg: ChatWithUser = {
      id: Date.now(),
      gameId: activeGame.id,
      userId: user.fid,
      user: {
        id: user.fid,
        fid: user.fid,
        name: user.username,
        imageUrl: user.pfpUrl,
      },
      message: text,
      createdAt: new Date(),
    };
    addOptimisticMessage(optimisticMsg);

    try {
      const result = await sendMessageAction({
        gameId: activeGame.id,
        message: text,
        fid: user.fid,
      });
      if (!result.success) {
        console.error("sendMessageAction failed:", result.error);
        notify.error(`Failed to send: ${result.error}`);
        removeOptimisticMessage(optimisticMsg.id);
      }
      return result;
    } catch (error) {
      console.error("Error calling sendMessageAction:", error);
      notify.error("Network error sending message.");
      removeOptimisticMessage(optimisticMsg.id);
      return { success: false, error: "Network error." };
    }
  },
  gameOver: () => {
    set((state) => ({
      ...state,
      gameState: "GAME_OVER",
    }));
    const soundEnabled = get().activeGame?.config?.soundEnabled;
    if (soundEnabled) SoundManager.play("gameOver");
  },
  resetGame: () => {
    set((state) => ({
      ...state,
      ...initialGameSliceState,
    }));
    SoundManager.stopAll();
  },

  // === Lobby Slice Actions ===
  setTicket: (ticket) => {
    set((state) => ({
      ...state,
      ticket,
    }));
  },
  setMyReferral: (referral) => {
    set((state) => ({
      ...state,
      myReferral: referral,
    }));
  },
  setInvitedBy: (invitedBy) => {
    set((state) => ({
      ...state,
      invitedBy,
    }));
  },
  setHasValidInvite: (isValid) => {
    set((state) => ({
      ...state,
      hasValidInvite: isValid,
    }));
  },
  setInviteStatusLoaded: (isLoaded) => {
    set((state) => ({
      ...state,
      inviteStatusLoaded: isLoaded,
    }));
  },
  fetchTicket: async (fid, gameId) => {
    set((state) => ({
      ...state,
      lobbyLoading: true,
      lobbyError: null,
    }));
    try {
      const res = await fetch(`/api/tickets?gameId=${gameId}`, {
        // Fetch specific ticket
        headers: { "x-farcaster-id": fid },
        cache: "no-store",
      });
      if (!res.ok)
        throw new Error((await res.text()) || "Failed to fetch ticket");
      const tickets: Ticket[] = await res.json();
      const foundTicket = tickets.find((t) => t.gameId === gameId) ?? null;
      set((state) => ({
        ...state,
        ticket: foundTicket,
        lobbyLoading: false,
      }));
      return foundTicket;
    } catch (error) {
      console.error("Zustand fetchTicket error:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to load ticket";
      set((state) => ({
        ...state,
        ticket: null,
        lobbyLoading: false,
        lobbyError: errorMsg,
      }));
      return null;
    }
  },

  fetchReferralStatus: async (fidString) => {
    set((state) => ({
      ...state,
      lobbyLoading: true,
      lobbyError: null,
      inviteStatusLoaded: false,
    }));
    try {
      const res = await fetch(`/api/referral/status?fid=${fidString}`, {
        cache: "no-store",
      });
      if (!res.ok)
        throw new Error(
          (await res.text()) || "Failed to fetch referral status"
        );
      const statusData: { hasInvite: boolean; referral?: InvitedBy } =
        await res.json();
      set((state) => ({
        ...state,
        hasValidInvite: statusData.hasInvite,
        invitedBy: statusData.referral ?? null,
        inviteStatusLoaded: true,
        lobbyLoading: false,
      }));
    } catch (error) {
      console.error("Zustand fetchReferralStatus error:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to load referral status";
      set((state) => ({
        ...state,
        hasValidInvite: false,
        invitedBy: null,
        inviteStatusLoaded: true,
        lobbyLoading: false,
        lobbyError: errorMsg,
      }));
    }
  },
  fetchMyReferralCode: async (fidString) => {
    set((state) => ({
      ...state,
      lobbyLoading: true,
      lobbyError: null,
    }));
    try {
      const result = await getOrCreateReferralCodeAction(Number(fidString));
      if (result.success) {
        set((state) => ({
          ...state,
          myReferral: {
            code: result.code,
            inviterFarcasterId: fidString,
            inviteeId: result.inviteeId,
          },
          lobbyLoading: false,
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Zustand fetchMyReferralCode error:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to get referral code";
      set((state) => ({
        ...state,
        myReferral: null,
        lobbyLoading: false,
        lobbyError: errorMsg,
      }));
    }
  },

  // === Profile Slice Actions ===
  setProfileData: (data) => {
    set((state) => ({
      ...state,
      ...(data.username !== undefined ? { username: data.username } : {}),
      ...(data.wallet !== undefined ? { wallet: data.wallet } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      ...(data.fid !== undefined ? { fid: data.fid } : {}),
      ...(data.streak !== undefined ? { streak: data.streak } : {}),
      ...(data.profileSummaryStats !== undefined
        ? { profileSummaryStats: data.profileSummaryStats }
        : {}),
      ...(data.allTimeStats !== undefined
        ? { allTimeStats: data.allTimeStats }
        : {}),
      ...(data.gameHistory !== undefined
        ? { gameHistory: data.gameHistory }
        : {}),
      ...(data.myReferral !== undefined ? { myReferral: data.myReferral } : {}),
      ...(data.profileLoading !== undefined
        ? { profileLoading: data.profileLoading }
        : {}),
      ...(data.hasLoadedProfile !== undefined
        ? { hasLoadedProfile: data.hasLoadedProfile }
        : {}),
      ...(data.profileError !== undefined
        ? { profileError: data.profileError }
        : {}),
    }));
  },
  resetProfile: () => {
    set((state) => ({
      ...state,
      ...initialProfileSliceState,
    }));
  },
  updateProfile: async (input) => {
    set((state) => ({
      ...state,
      profileLoading: true,
      profileError: null,
    }));
    try {
      const result = await updateProfileAction({
        fid: Number(input.fid),
        name: input.name,
        wallet: input.wallet,
        imageUrl: input.imageUrl,
      });
      if (result.success) {
        set((state) => ({
          ...state,
          username: result.user.name,
          wallet: result.user.wallet,
          imageUrl: result.user.imageUrl,
          profileLoading: false,
        }));
        notify.success("Profile updated!");
        return result;
      } else {
        const errorMsg = Array.isArray(result.error)
          ? result.error.map((e) => e.message).join(", ")
          : result.error;
        set((state) => ({
          ...state,
          profileLoading: false,
          profileError: errorMsg,
        }));
        notify.error(`Update failed: ${errorMsg}`);
        return result;
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Network error.";
      set((state) => ({
        ...state,
        profileLoading: false,
        profileError: errorMsg,
      }));
      notify.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },
}));

// === Common Selectors ===
export const useActiveGame = () => useAppStore((state) => state.activeGame);
export const useTicket = () => useAppStore((state) => state.ticket);
export const useInviteStatus = () =>
  useAppStore((state) => ({
    hasValidInvite: state.hasValidInvite,
    inviteStatusLoaded: state.inviteStatusLoaded,
    invitedBy: state.invitedBy,
    myReferral: state.myReferral,
  }));
export const useGameState = () => useAppStore((state) => state.gameState);
export const useChatMessages = () => useAppStore((state) => state.messages);
export const useProfileSummary = () =>
  useAppStore((state) => ({
    username: state.username,
    imageUrl: state.imageUrl,
    streak: state.streak,
    fid: state.fid,
    wallet: state.wallet,
  }));
export const useProfileStateStatus = () =>
  useAppStore((state) => ({
    isLoading: state.profileLoading,
    hasLoaded: state.hasLoadedProfile,
    error: state.profileError,
  }));
export const useProfileStats = () =>
  useAppStore((state) => ({
    summary: state.profileSummaryStats,
    allTime: state.allTimeStats,
  }));
export const useGameHistory = () => useAppStore((state) => state.gameHistory);
