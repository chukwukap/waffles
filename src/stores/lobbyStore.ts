import { create } from "zustand";

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

interface LobbyState {
  // Referral part
  referralCode: string;
  referralStatus: ReferralStatus;
  referralData?: ReferralData;
  createReferral: (inviterId: number) => Promise<void>;
  validateReferral: (code: string, inviteeId: number) => Promise<void>;
  // Lobby stats & countdown
  stats: LobbyStats | null;
  countdown: string;
  fetchStats: () => Promise<void>;
  startCountdown: (target: Date) => void;
}

export const useLobbyStore = create<LobbyState>((set) => ({
  // Referral state
  referralCode: "",
  referralStatus: "idle",
  referralData: undefined,
  createReferral: async (inviterId) => {
    set({ referralStatus: "validating" });
    try {
      const res = await fetch("/api/referral/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviterId }),
      });
      const data = await res.json();
      set({
        referralCode: data.code,
        referralData: data,
        referralStatus: "success",
      });
    } catch {
      set({ referralStatus: "failed" });
    }
  },
  validateReferral: async (code, inviteeId) => {
    set({ referralStatus: "validating" });
    try {
      const res = await fetch("/api/referral/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, inviteeId }),
      });
      const data = await res.json();
      set({
        referralStatus: data.success ? "success" : "failed",
        referralData: data.referral,
      });
    } catch {
      set({ referralStatus: "failed" });
    }
  },
  // Lobby stats & countdown
  stats: null,
  countdown: "00:00",
  fetchStats: async () => {
    try {
      const res = await fetch("/api/lobby/stats");
      const data = await res.json();
      set({ stats: data });
    } catch (e) {
      console.error(e);
    }
  },
  startCountdown: (target) => {
    const interval = setInterval(() => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        clearInterval(interval);
        set({ countdown: "00:00" });
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
}));
