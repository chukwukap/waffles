// ───────────────────────── src/stores/lobbyStore.ts ─────────────────────────
// Fully fixed for Zustand v5 typing + persistence + single ticket per game.

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  gameId?: number;
}

// ───────────────────────── STATE INTERFACE ─────────────────────────
interface LobbyState {
  // Referral
  referralCode: string;
  referralStatus: ReferralStatus;
  referralData?: ReferralData;
  createReferral: (inviterId: number, farcasterId: number) => Promise<void>;
  validateReferral: (code: string, farcasterId: number) => Promise<void>;

  // Stats
  stats: LobbyStats | null;
  countdown: string;
  fetchStats: () => Promise<void>;
  startCountdown: (target: Date) => void;
  stopCountdown: () => void;

  // Ticket
  ticket: Ticket | null;
  purchaseStatus: TicketStatus;
  buyTicket: (userId: number, gameId: number, amount: number) => Promise<void>;
  confirmTicket: (ticketId: number) => Promise<void>;
}

// ───────────────────────── STORE ─────────────────────────
export const useLobbyStore = create<LobbyState>()(
  persist(
    (set, get) => {
      let countdownInterval: ReturnType<typeof setInterval> | null = null;

      return {
        // ───────────────────────── REFERRAL ─────────────────────────
        referralCode: "",
        referralStatus: "idle",
        referralData: undefined,

        // Note: createReferral kept as-is (hits /api/referral/create), adjust if not used

        async createReferral(inviterId: number, farcasterId: number) {
          set({ referralStatus: "validating" });
          try {
            const res = await fetch("/api/referral/create", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-farcaster-id": farcasterId.toString(),
              },
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

        async validateReferral(code: string, farcasterId: number) {
          set({ referralStatus: "validating" });
          try {
            const res = await fetch("/api/referrals", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-farcaster-id": farcasterId.toString(),
              },
              body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (!res.ok || data.valid !== true) {
              set({ referralStatus: "failed" });
              return;
            }
            set({
              referralStatus: "success",
              referralCode: code,
              // The /api/referrals POST does not return full referralData.
              // For consistency, only set code here. Extend if backend returns more.
              referralData: data.referral ?? { code },
            });
          } catch {
            set({ referralStatus: "failed" });
          }
        },

        // ───────────────────────── STATS ─────────────────────────
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
          if (countdownInterval) clearInterval(countdownInterval);
          countdownInterval = setInterval(() => {
            const diff = target.getTime() - Date.now();
            if (diff <= 0) {
              clearInterval(countdownInterval!);
              countdownInterval = null;
              set({ countdown: "00:00" });
            } else {
              const m = Math.floor(diff / 60000);
              const s = Math.floor((diff % 60000) / 1000);
              set({
                countdown: `${String(m).padStart(2, "0")}:${String(s).padStart(
                  2,
                  "0"
                )}`,
              });
            }
          }, 1000);
        },
        stopCountdown() {
          if (countdownInterval) clearInterval(countdownInterval);
          countdownInterval = null;
        },

        // ───────────────────────── TICKETS ─────────────────────────
        ticket: null,
        purchaseStatus: "idle",
        async buyTicket(userId, gameId, amount) {
          // 🧠 One-ticket-per-game rule
          const current = get().ticket;
          if (current && current.gameId === gameId) {
            console.warn("User already owns a ticket for this game.");
            set({ purchaseStatus: "confirmed" });
            return;
          }

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
                gameId,
              },
              purchaseStatus: "confirmed",
            });
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
              ticket: s.ticket
                ? { ...s.ticket, status: "confirmed" }
                : { id: ticketId, status: "confirmed" },
              purchaseStatus: "confirmed",
            }));
          } catch (e) {
            console.error("confirmTicket error:", e);
          }
        },
      };
    },
    {
      name: "lobby-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        referralCode: state.referralCode,
        referralStatus: state.referralStatus,
        referralData: state.referralData,
        ticket: state.ticket,
        purchaseStatus: state.purchaseStatus,
      }),
    }
  )
);
