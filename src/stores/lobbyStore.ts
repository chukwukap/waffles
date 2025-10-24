"use client";

import { create } from "zustand";

// ───────────────────────── TYPES ─────────────────────────
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

interface ReferralData {
  code: string;
  inviterFarcasterId: string;
  inviteeId?: number;
}

interface InvitedBy {
  code: string;
  inviterFarcasterId: string | null;
  acceptedAt?: string | null;
}

interface Ticket {
  id?: number;
  gameId?: number;
  txHash?: string | null;
  code?: string;
  amountUSDC?: number;
  status?: string;
  purchasedAt?: string;
  usedAt?: string | null;
}

// ───────────────────────── STATE INTERFACE ─────────────────────────
interface LobbyState {
  // Referral
  referralData: ReferralData | null;
  invitedBy: InvitedBy | null;
  createReferral: (farcasterId: string) => Promise<void>;
  validateReferral: (code: string, farcasterId: string) => Promise<void>;
  setReferralData: (data: ReferralData | null) => void;
  hasValidInvite: boolean;
  inviteStatusLoaded: boolean;
  fetchReferralStatus: (farcasterId: string) => Promise<void>;
  // Stats
  stats: LobbyStats | null;
  fetchStats: () => Promise<void>;

  // Ticket
  ticket: Ticket | null;
  buyTicket: (fid: number, gameId: number) => Promise<void>;
  fetchTicket: (farcasterId: string, gameId: number) => Promise<void>;
}

// ───────────────────────── STORE ─────────────────────────
export const useLobbyStore = create<LobbyState>()((set, get) => {
  return {
    // ───────────────────────── REFERRAL ─────────────────────────
    referralData: null,
    invitedBy: null,
    hasValidInvite: false,
    inviteStatusLoaded: false,

    setReferralData(data) {
      set({ referralData: data ?? null });
    },

    async fetchReferralStatus(farcasterId: string) {
      try {
        const res = await fetch(
          `/api/referral/status?fid=${encodeURIComponent(farcasterId)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Failed to fetch referral status");
        const data = await res.json();
        set({
          hasValidInvite: Boolean(data?.hasInvite),
          inviteStatusLoaded: true,
          invitedBy: data?.referral
            ? {
                code: data.referral.code,
                inviterFarcasterId: data.referral.inviterFarcasterId ?? null,
                acceptedAt: data.referral.acceptedAt ?? null,
              }
            : null,
        });
      } catch (err) {
        console.error("fetchReferralStatus error", err);
        set({
          hasValidInvite: false,
          inviteStatusLoaded: true,
          invitedBy: null,
        });
      }
    },

    async createReferral(farcasterId: string) {
      try {
        const res = await fetch("/api/referral/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ farcasterId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create referral");
        set({
          referralData: {
            code: data.code,
            inviterFarcasterId: farcasterId,
            inviteeId: data.inviteeId,
          },
          invitedBy: get().invitedBy,
          inviteStatusLoaded: true,
        });
      } catch (err) {
        console.error(err);
      }
    },

    async validateReferral(code: string, farcasterId: string) {
      try {
        const res = await fetch("/api/referral/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, farcasterId }),
        });

        const data = await res.json();
        console.log("validateReferral data:", data);
        if (data.valid) {
          set({
            hasValidInvite: true,
            inviteStatusLoaded: true,
          });
          await get().fetchReferralStatus(farcasterId);
        } else {
          set({
            hasValidInvite: false,
            inviteStatusLoaded: true,
            invitedBy: null,
          });
        }
      } catch (err) {
        console.error(err);
        set({
          hasValidInvite: false,
          inviteStatusLoaded: true,
          invitedBy: null,
        });
      }
    },

    // ───────────────────────── STATS ─────────────────────────
    stats: null,
    async fetchStats() {
      try {
        const res = await fetch("/api/lobby/stats");
        if (!res.ok) throw new Error("Failed to fetch lobby stats");
        const data = await res.json();
        set({ stats: data });
      } catch (e) {
        console.error("fetchStats error:", e);
      }
    },

    // ───────────────────────── TICKETS ─────────────────────────
    ticket: null,
    async buyTicket(fid: number, gameId) {
      // 🧠 One-ticket-per-game rule
      const current = get().ticket;
      if (!gameId) {
        console.error("Game ID is not set");
        return;
      }

      if (!get().hasValidInvite) {
        throw new Error("Invite required");
      }

      if (current && current.gameId === gameId) {
        console.warn("User already owns a ticket for this game.");
        return;
      }
      try {
        const res = await fetch("/api/tickets/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ farcasterId: fid.toString(), gameId }),
        });
        if (!res.ok) throw new Error("Ticket purchase failed");
        const ticket = await res.json();
        set({ ticket });
        await get().fetchStats();
      } catch (e) {
        console.error("buyTicket error:", e);
        set({ ticket: null });
      }
    },

    // ───────────────────────── FETCH TICKET (from /api/tickets -- route.ts) ─────────────────────────
    async fetchTicket(farcasterId: string, gameId: number) {
      try {
        const res = await fetch("/api/tickets", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-farcaster-id": farcasterId,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch tickets");
        const data = await res.json();
        if (Array.isArray(data)) {
          // Find the ticket for the gameId
          const ticket = data.find((t) => t.gameId === gameId);
          if (ticket) {
            set({ ticket });
          } else {
            set({ ticket: null });
          }
        } else {
          set({ ticket: null });
        }
      } catch (e) {
        console.error("fetchTicket error:", e);
        set({ ticket: null });
      }
    },
  };
});
