import { create } from "zustand";

interface SafeArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface AuthState {
  fid: number | null;
  username: string;
  pfpUrl: string;
  walletAddress: string;
  safeArea: SafeArea;
  setUser: (u: Partial<AuthState>) => void;
  setWallet: (addr: string) => void;
  setSafeArea: (a: SafeArea) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  fid: null,
  username: "",
  pfpUrl: "",
  walletAddress: "",
  safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
  setUser: (u) => set((s) => ({ ...s, ...u })),
  setWallet: (addr) => set({ walletAddress: addr }),
  setSafeArea: (a) => set({ safeArea: a }),
  reset: () =>
    set({
      fid: null,
      username: "",
      pfpUrl: "",
      walletAddress: "",
      safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
    }),
}));
