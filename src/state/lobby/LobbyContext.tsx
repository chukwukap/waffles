"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";

interface Player {
  username: string;
  wallet: string;
  pfpUrl: string | null;
}

interface LobbyStats {
  totalTickets: number;
  totalPrize: number;
  players: Player[];
}

export interface Ticket {
  id?: number;
  gameId?: number;
  txHash?: string | null;
  code?: string;
  amountUSDC?: number;
  status?: string;
  purchasedAt?: string;
  usedAt?: string | null;
}

interface ReferralCode {
  code: string;
  inviterFarcasterId: string;
  inviteeId?: number;
}

interface InvitedBy {
  code: string;
  inviterFarcasterId: string | null;
  acceptedAt?: string | null;
}

interface LobbyState {
  stats: LobbyStats | null;
  statsLoading: boolean;
  ticket: Ticket | null;
  ticketLoading: boolean;
  myReferral: ReferralCode | null;
  invitedBy: InvitedBy | null;
  hasValidInvite: boolean;
  inviteStatusLoaded: boolean;
  lastError: string | null;
}

type LobbyAction =
  | { type: "SET_STATS"; stats: LobbyStats | null; loading?: boolean }
  | { type: "SET_TICKET"; ticket: Ticket | null; loading?: boolean }
  | { type: "SET_MY_REFERRAL"; referral: ReferralCode | null }
  | { type: "SET_INVITED_BY"; invitedBy: InvitedBy | null }
  | { type: "SET_HAS_INVITE"; value: boolean }
  | { type: "SET_INVITE_STATUS_LOADED"; value: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_TICKET_LOADING"; value: boolean }
  | { type: "SET_STATS_LOADING"; value: boolean };

const initialState: LobbyState = {
  stats: null,
  statsLoading: false,
  ticket: null,
  ticketLoading: false,
  myReferral: null,
  invitedBy: null,
  hasValidInvite: false,
  inviteStatusLoaded: false,
  lastError: null,
};

function lobbyReducer(state: LobbyState, action: LobbyAction): LobbyState {
  switch (action.type) {
    case "SET_STATS":
      return {
        ...state,
        stats: action.stats,
        statsLoading: action.loading ?? false,
      };
    case "SET_TICKET":
      return {
        ...state,
        ticket: action.ticket,
        ticketLoading: action.loading ?? false,
      };
    case "SET_MY_REFERRAL":
      return { ...state, myReferral: action.referral };
    case "SET_INVITED_BY":
      return { ...state, invitedBy: action.invitedBy };
    case "SET_HAS_INVITE":
      return { ...state, hasValidInvite: action.value };
    case "SET_INVITE_STATUS_LOADED":
      return { ...state, inviteStatusLoaded: action.value };
    case "SET_ERROR":
      return { ...state, lastError: action.error };
    case "SET_TICKET_LOADING":
      return { ...state, ticketLoading: action.value };
    case "SET_STATS_LOADING":
      return { ...state, statsLoading: action.value };
    default:
      return state;
  }
}

interface LobbyContextValue extends LobbyState {
  refreshStats: () => Promise<void>;
  fetchTicket: (farcasterId: string, gameId: number) => Promise<void>;
  purchaseTicket: (
    farcasterId: number,
    gameId: number,
    txHash?: string | null
  ) => Promise<Ticket | null>;
  createReferral: (farcasterId: string) => Promise<ReferralCode | null>;
  validateReferral: (code: string, farcasterId: string) => Promise<boolean>;
  fetchReferralStatus: (farcasterId: string) => Promise<boolean>;
  registerReferralCode: (referral: ReferralCode) => void;
  clearError: () => void;
}

const LobbyContext = createContext<LobbyContextValue | undefined>(undefined);

export function LobbyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(lobbyReducer, initialState);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", error: null });
  }, []);

  const refreshStats = useCallback(async () => {
    dispatch({ type: "SET_STATS_LOADING", value: true });
    try {
      const res = await fetch("/api/lobby/stats");
      if (!res.ok) throw new Error("Failed to fetch lobby stats");
      const data = await res.json();
      dispatch({ type: "SET_STATS", stats: data });
    } catch (error) {
      console.error("refreshStats error:", error);
      dispatch({ type: "SET_ERROR", error: "Failed to load stats" });
      dispatch({ type: "SET_STATS", stats: null, loading: false });
    }
  }, []);

  const fetchTicket = useCallback(
    async (farcasterId: string, gameId: number) => {
      dispatch({ type: "SET_TICKET_LOADING", value: true });
      try {
        const res = await fetch("/api/tickets", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-farcaster-id": farcasterId,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch tickets");
        const data: Ticket[] = await res.json();
        const found = Array.isArray(data)
          ? data.find((ticket) => ticket.gameId === gameId) ?? null
          : null;
        dispatch({
          type: "SET_TICKET",
          ticket: found,
          loading: false,
        });
      } catch (error) {
        console.error("fetchTicket error:", error);
        dispatch({ type: "SET_ERROR", error: "Failed to load ticket" });
        dispatch({ type: "SET_TICKET", ticket: null, loading: false });
      }
    },
    []
  );

  const purchaseTicket = useCallback(
    async (farcasterId: number, gameId: number, txHash?: string | null) => {
      dispatch({ type: "SET_TICKET_LOADING", value: true });
      try {
        const res = await fetch("/api/tickets/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            farcasterId: farcasterId.toString(),
            gameId,
            txHash: txHash ?? null,
          }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || "Ticket purchase failed");
        }
        const ticket = (await res.json()) as Ticket;
        dispatch({ type: "SET_TICKET", ticket, loading: false });
        dispatch({ type: "SET_ERROR", error: null });
        await refreshStats();
        return ticket;
      } catch (error) {
        console.error("purchaseTicket error:", error);
        dispatch({
          type: "SET_ERROR",
          error:
            error instanceof Error
              ? error.message
              : "Ticket purchase failed",
        });
        dispatch({ type: "SET_TICKET_LOADING", value: false });
        return null;
      }
    },
    [refreshStats]
  );

  const createReferral = useCallback(async (farcasterId: string) => {
    try {
      const res = await fetch("/api/referral/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farcasterId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create referral");
      const referral: ReferralCode = {
        code: data.code,
        inviterFarcasterId: farcasterId,
        inviteeId: data.inviteeId,
      };
      dispatch({ type: "SET_MY_REFERRAL", referral });
      dispatch({ type: "SET_ERROR", error: null });
      return referral;
    } catch (error) {
      console.error("createReferral error", error);
      dispatch({
        type: "SET_ERROR",
        error:
          error instanceof Error ? error.message : "Failed to create referral",
      });
      return null;
    }
  }, []);

  const fetchReferralStatus = useCallback(async (farcasterId: string) => {
    let hasInvite = false;
    try {
      const res = await fetch(
        `/api/referral/status?fid=${encodeURIComponent(farcasterId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to fetch referral status");
      const data = await res.json();
      hasInvite = Boolean(data?.hasInvite);
      dispatch({ type: "SET_HAS_INVITE", value: hasInvite });
      dispatch({
        type: "SET_INVITED_BY",
        invitedBy: data?.referral
          ? {
              code: data.referral.code,
              inviterFarcasterId: data.referral.inviterFarcasterId ?? null,
              acceptedAt: data.referral.acceptedAt ?? null,
            }
          : null,
      });
    } catch (error) {
      console.error("fetchReferralStatus error", error);
      dispatch({ type: "SET_HAS_INVITE", value: false });
      dispatch({ type: "SET_INVITED_BY", invitedBy: null });
    } finally {
      dispatch({ type: "SET_INVITE_STATUS_LOADED", value: true });
    }
    return hasInvite;
  }, []);

  const validateReferral = useCallback(
    async (code: string, farcasterId: string) => {
      try {
        const res = await fetch("/api/referral/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, farcasterId }),
        });
        const data = await res.json();
        if (!data.valid) {
          dispatch({ type: "SET_HAS_INVITE", value: false });
          dispatch({
            type: "SET_ERROR",
            error: data.error ?? "Invalid invite code",
          });
          return false;
        }

        dispatch({ type: "SET_HAS_INVITE", value: true });
        dispatch({
          type: "SET_INVITED_BY",
          invitedBy: {
            code: data.referral.code,
            inviterFarcasterId: data.referral.inviter?.farcasterId ?? null,
            acceptedAt: data.referral.acceptedAt ?? null,
          },
        });
        dispatch({ type: "SET_ERROR", error: null });
        await fetchReferralStatus(farcasterId);
        return true;
      } catch (error) {
        console.error("validateReferral error", error);
        dispatch({
          type: "SET_ERROR",
          error:
            error instanceof Error ? error.message : "Failed to validate code",
        });
        return false;
      }
    },
    [fetchReferralStatus]
  );

  const registerReferralCode = useCallback((referral: ReferralCode) => {
    dispatch({ type: "SET_MY_REFERRAL", referral });
  }, []);

  const value = useMemo<LobbyContextValue>(
    () => ({
      ...state,
      refreshStats,
      fetchTicket,
      purchaseTicket,
      createReferral,
      validateReferral,
      fetchReferralStatus,
      registerReferralCode,
      clearError,
    }),
    [
      state,
      refreshStats,
      fetchTicket,
      purchaseTicket,
      createReferral,
      validateReferral,
      fetchReferralStatus,
      registerReferralCode,
      clearError,
    ]
  );

  return <LobbyContext.Provider value={value}>{children}</LobbyContext.Provider>;
}

export function useLobby() {
  const context = useContext(LobbyContext);
  if (!context) {
    throw new Error("useLobby must be used within a LobbyProvider");
  }
  return context;
}
