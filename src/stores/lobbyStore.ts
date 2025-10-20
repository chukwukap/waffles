"use client";
import { create } from "zustand";
import * as api from "@/lib/apiMocks";

interface WaffleType {
  id: string;
  name: string;
  description: string;
  remaining: number;
}

interface Ticket {
  ticketId: number;
  waffleType: string;
  message: string;
}

interface LobbyState {
  inviteCode: string;
  inviteCodeStatus: "idle" | "checking" | "valid" | "invalid";
  codeError: string | null;
  waffleTypes: WaffleType[];
  selectedWaffleType: WaffleType | null;
  purchaseStatus: "idle" | "loading" | "success" | "error";
  purchasedTicket: Ticket | null;
  setInviteCode: (code: string) => void;
  validateInviteCode: (code: string) => Promise<void>;
  selectWaffleType: (id: string) => void;
  purchaseWaffle: () => Promise<void>;
  reset: () => void;
}

const useLobbyStore = create<LobbyState>((set, get) => ({
  inviteCode: "",
  inviteCodeStatus: "idle",
  codeError: null,
  waffleTypes: [
    {
      id: "football",
      name: "Football Waffle",
      description: "Entry ticket for Football-themed Waffles tournament",
      remaining: 120,
    },
    {
      id: "basketball",
      name: "Basketball Waffle",
      description: "Entry ticket for Basketball-themed Waffles tournament",
      remaining: 80,
    },
    // Add more types as needed
  ],
  selectedWaffleType: null,
  purchaseStatus: "idle",
  purchasedTicket: null,
  setInviteCode: (code) => {
    // Reset validation state when code changes
    const currentStatus = get().inviteCodeStatus;
    set({
      inviteCode: code,
      inviteCodeStatus: currentStatus === "checking" ? "checking" : "idle",
      codeError: null,
    });
  },
  validateInviteCode: async (code) => {
    set({ inviteCodeStatus: "checking", inviteCode: code });
    try {
      const res = await api.validateInviteCode(code);
      // If inviteCode has changed since we started validation, ignore this result
      if (get().inviteCode !== code) return;
      if (res.valid) {
        set({ inviteCodeStatus: "valid", codeError: null });
      } else {
        set({
          inviteCodeStatus: "invalid",
          codeError: res.message || "Invalid invite code",
        });
      }
    } catch (error) {
      console.error(error);
      set({
        inviteCodeStatus: "invalid",
        codeError: "Network error, please try again",
      });
    }
  },
  selectWaffleType: (id) => {
    const type = get().waffleTypes.find((w) => w.id === id) || null;
    set({ selectedWaffleType: type });
  },
  purchaseWaffle: async () => {
    const selected = get().selectedWaffleType;
    if (!selected) return;
    set({ purchaseStatus: "loading" });
    try {
      const ticket = await api.purchaseWaffle(selected.id);
      // Optionally update inventory count:
      set((state) => ({
        purchaseStatus: "success",
        purchasedTicket: ticket,
        waffleTypes: state.waffleTypes.map((w) =>
          w.id === selected.id
            ? { ...w, remaining: Math.max(w.remaining - 1, 0) }
            : w
        ),
      }));
    } catch (error) {
      console.error(error);
      set({ purchaseStatus: "error" });
    }
  },
  reset: () => {
    set({
      inviteCode: "",
      inviteCodeStatus: "idle",
      codeError: null,
      selectedWaffleType: null,
      purchaseStatus: "idle",
      purchasedTicket: null,
    });
  },
}));

export default useLobbyStore;
