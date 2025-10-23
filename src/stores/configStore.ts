import { create } from "zustand";

export interface BaseConfig {
  ticketPrice: number;
  roundTimeLimit: number;
  questionsPerGame: number;
  scoreMultiplier: number;
  scorePenalty: number | null;
  maxPlayers: number;
  soundEnabled: boolean;
  animationEnabled: boolean;
  timeBonusEnabled: boolean;
  difficultyScaling: number;
}

type PartialConfig = Partial<BaseConfig>;

interface ConfigState {
  global: BaseConfig | null;
  byGameId: Record<number, BaseConfig | null>;
  loading: boolean;
  error: string | null;
  fetchGlobal: () => Promise<void>;
  fetchGame: (gameId: number) => Promise<void>;
  updateGlobal: (input: PartialConfig, adminToken: string) => Promise<void>;
  updateGame: (
    gameId: number,
    input: PartialConfig,
    adminToken: string
  ) => Promise<void>;
  getEffectiveForGame: (gameId: number) => BaseConfig | null;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  global: null,
  byGameId: {},
  loading: false,
  error: null,

  fetchGlobal: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/config/global");
      if (!res.ok) throw new Error("Failed to load global config");
      const data = await res.json();
      set({ global: data, loading: false });
    } catch (e) {
      console.error(e);
      set({
        error: "Failed to load global config",
        loading: false,
      });
    }
  },

  fetchGame: async (gameId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/config/game/${gameId}`);
      if (!res.ok) throw new Error("Failed to load game config");
      const data = await res.json();
      set((s) => ({
        byGameId: { ...s.byGameId, [gameId]: data },
        loading: false,
      }));
    } catch (e) {
      console.error(e);
      set({
        error: "Failed to load game config",
        loading: false,
      });
    }
  },

  updateGlobal: async (input, adminToken) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/config/global", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to update global config");
      const data = await res.json();
      set({ global: data, loading: false });
    } catch (e) {
      console.error(e);
      set({
        error: "Failed to update global config",
        loading: false,
      });
    }
  },

  updateGame: async (gameId, input, adminToken) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/config/game/${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to update game config");
      const data = await res.json();
      set((s) => ({
        byGameId: { ...s.byGameId, [gameId]: data },
        loading: false,
      }));
    } catch (e) {
      console.error(e);
      set({
        error: "Failed to update game config",
        loading: false,
      });
    }
  },

  getEffectiveForGame: (gameId) => {
    const { global, byGameId } = get();
    const game = byGameId[gameId];
    if (!global && !game) return null;
    return { ...(global ?? ({} as BaseConfig)), ...(game ?? {}) } as BaseConfig;
  },
}));
