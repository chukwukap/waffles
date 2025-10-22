import { create } from "zustand";

interface Ticket {
  id?: number;
  txHash?: string;
  amountUSDC?: number;
  status?: "idle" | "pending" | "confirmed" | "failed";
}

interface TicketState {
  ticket: Ticket | null;
  purchaseStatus: Ticket["status"];
  buyTicket: (userId: number, gameId: number, amount: number) => Promise<void>;
  confirmTicket: (ticketId: number) => Promise<void>;
}

export const useTicketStore = create<TicketState>((set) => ({
  ticket: null,
  purchaseStatus: "idle",
  buyTicket: async (userId, gameId, amount) => {
    set({ purchaseStatus: "pending" });
    try {
      const res = await fetch("/api/tickets/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, gameId, amount }),
      });
      const data = await res.json();
      set({ ticket: data, purchaseStatus: "confirmed" });
    } catch {
      set({ purchaseStatus: "failed" });
    }
  },
  confirmTicket: async (ticketId) => {
    await fetch(`/api/tickets/confirm`, {
      method: "POST",
      body: JSON.stringify({ ticketId }),
    });
  },
}));
