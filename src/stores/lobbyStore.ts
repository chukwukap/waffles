// ───────────────────────── src/stores/lobbyStore.ts ─────────────────────────
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
  inviterId: number;
  inviteeId?: number;
}

type ReferralStatus = "idle" | "validating" | "success" | "failed";
type TicketStatus = "idle" | "pending" | "confirmed" | "failed";

interface Ticket {
  id?: number;
  txHash?: string;
  amountUSDC?: number;
  status: TicketStatus;
}

// ───────────────────────── STATE INTERFACE ─────────────────────────
interface LobbyState {
  // Referral state
  referralCode: string;
  referralStatus: ReferralStatus;
  referralData?: ReferralData;
  createReferral: (inviterId: number) => Promise<void>;
  validateReferral: (code: string, inviteeId: number) => Promise<void>;

  // Lobby stats
  stats: LobbyStats | null;
  countdown: string;
  fetchStats: () => Promise<void>;
  startCountdown: (target: Date) => void;
  stopCountdown: () => void;

  // Ticket system
  ticket: Ticket | null;
  purchaseStatus: TicketStatus;
  buyTicket: (userId: number, gameId: number, amount: number) => Promise<void>;
  confirmTicket: (ticketId: number) => Promise<void>;
}

// ───────────────────────── STORE IMPLEMENTATION ─────────────────────────
export const useLobbyStore = create<LobbyState>((set, get) => {
  let countdownInterval: NodeJS.Timeout | null = null;

  return {
    // Referral state
    referralCode: "",
    referralStatus: "idle",
    referralData: undefined,

    async createReferral(inviterId) {
      set({ referralStatus: "validating" });
      try {
        const res = await fetch("/api/referral/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviterId }),
        });

        if (!res.ok) throw new Error("Failed to create referral");
        const data: ReferralData = await res.json();

        set({
          referralCode: data.code,
          referralData: data,
          referralStatus: "success",
        });
      } catch {
        set({ referralStatus: "failed" });
      }
    },

    async validateReferral(code, inviteeId) {
      set({ referralStatus: "validating" });
      try {
        const res = await fetch("/api/referral/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, inviteeId }),
        });

        if (!res.ok) throw new Error("Invalid referral");
        const data = await res.json();

        set({
          referralStatus: data.success ? "success" : "failed",
          referralData: data.referral,
        });
      } catch {
        set({ referralStatus: "failed" });
      }
    },

    // Lobby stats
    stats: null,
    countdown: "00:00",

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

    startCountdown(target) {
      // Prevent multiple intervals
      if (countdownInterval) clearInterval(countdownInterval);

      countdownInterval = setInterval(() => {
        const diff = target.getTime() - Date.now();
        if (diff <= 0) {
          clearInterval(countdownInterval!);
          set({ countdown: "00:00" });
          countdownInterval = null;
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          const formatted = `${String(minutes).padStart(2, "0")}:${String(
            seconds
          ).padStart(2, "0")}`;
          set({ countdown: formatted });
        }
      }, 1000);
    },

    stopCountdown() {
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = null;
    },

    // Ticket
    ticket: null,
    purchaseStatus: "idle",

    async buyTicket(userId, gameId, amount) {
      set({ purchaseStatus: "pending" });
      try {
        const res = await fetch("/api/tickets/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, gameId, amount }),
        });

        if (!res.ok) throw new Error("Ticket purchase failed");
        const data = await res.json();

        set({
          ticket: {
            id: data.ticketId,
            status: "confirmed",
            amountUSDC: amount,
          },
          purchaseStatus: "confirmed",
        });

        // Refresh stats automatically
        await get().fetchStats();
      } catch (e) {
        console.error("buyTicket error:", e);
        set({ purchaseStatus: "failed" });
      }
    },

    async confirmTicket(ticketId) {
      try {
        const res = await fetch("/api/tickets/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId }),
        });

        if (!res.ok) throw new Error("Failed to confirm ticket");
        set((s) => ({
          ticket: { ...s.ticket, status: "confirmed" },
          purchaseStatus: "confirmed",
        }));
      } catch (e) {
        console.error("confirmTicket error:", e);
      }
    },
  };
});
