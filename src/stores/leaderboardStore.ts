// ──────────────────────────────────────────────────────────────────────────────
// stores/leaderboardStore.ts
// Efficient, cache-first Zustand store with SWR, pagination, and deduping.
// ──────────────────────────────────────────────────────────────────────────────
"use client";

import { create } from "zustand";

export type TabKey = "current" | "allTime";

export type LeaderboardUser = {
  id: string; // stable id from API
  rank: number; // server rank or client-computed
  name: string;
  avatarUrl: string; // use <Image src=.../>
  score: number;
};

type Slice = {
  items: LeaderboardUser[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  lastFetched: number; // ms
  inFlight?: AbortController; // dedupe/abort
  scrollTop: number; // remember per-tab scroll
};

type State = {
  activeTab: TabKey;
  slices: Record<TabKey, Slice>;
};

type Actions = {
  setActiveTab: (tab: TabKey) => void;
  rememberScroll: (tab: TabKey, y: number) => void;

  fetchPage: (
    tab: TabKey,
    opts?: { reset?: boolean; page?: number }
  ) => Promise<void>;
  refresh: (tab: TabKey) => Promise<void>;
};

const newSlice = (): Slice => ({
  items: [],
  page: 0,
  hasMore: true,
  isLoading: false,
  error: null,
  lastFetched: 0,
  scrollTop: 0,
});

const STALE_TTL = 30_000; // 30s

export const useLeaderboardStore = create<State & Actions>((set, get) => ({
  activeTab: "allTime",
  slices: {
    current: newSlice(),
    allTime: newSlice(),
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
    // lazy fetch if needed or stale
    const s = get().slices[tab];
    const stale = Date.now() - s.lastFetched > STALE_TTL;
    if (!s.isLoading && (s.items.length === 0 || stale)) {
      get().fetchPage(tab, { reset: s.items.length === 0 });
    }
  },

  rememberScroll: (tab, y) => {
    set((state) => ({
      slices: {
        ...state.slices,
        [tab]: { ...state.slices[tab], scrollTop: y },
      },
    }));
  },

  refresh: async (tab) => get().fetchPage(tab, { reset: true, page: 0 }),

  fetchPage: async (tab, opts) => {
    const { reset = false } = opts ?? {};
    const state = get();
    const slice = state.slices[tab];

    // Dedupe: abort prior request on this tab
    slice.inFlight?.abort();

    // SWR: if not reset and not stale, bail
    if (
      !reset &&
      slice.items.length &&
      Date.now() - slice.lastFetched < STALE_TTL
    ) {
      return;
    }

    const page = reset ? 0 : slice.page;

    const ctrl = new AbortController();
    set({
      slices: {
        ...state.slices,
        [tab]: {
          ...slice,
          isLoading: true,
          error: null,
          inFlight: ctrl,
          // keep items if not reset (SWR)
          ...(reset ? { items: [], hasMore: true, page: 0 } : null),
        },
      },
    });

    try {
      // API contract: GET /api/leaderboard?tab=current|allTime&page=X
      // should return: { users: LeaderboardUser[], hasMore: boolean }
      const res = await fetch(`/api/leaderboard?tab=${tab}&page=${page}`, {
        signal: ctrl.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const json: { users: LeaderboardUser[]; hasMore?: boolean } =
        await res.json();

      // Rank fix-up if server omits ranks
      const base = reset ? 0 : slice.items.length;
      const users =
        json.users?.map((u, i) => ({ ...u, rank: u.rank ?? base + i + 1 })) ??
        [];

      const merged = reset ? users : [...slice.items, ...users];

      set((curr) => ({
        slices: {
          ...curr.slices,
          [tab]: {
            ...curr.slices[tab],
            items: merged,
            page: page + 1,
            hasMore: json.hasMore ?? users.length > 0,
            isLoading: false,
            error: null,
            inFlight: undefined,
            lastFetched: Date.now(),
          },
        },
      }));
    } catch (err) {
      if ((err as { name: string })?.name === "AbortError") return; // aborted = ignore
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Something went wrong";
      set((curr) => ({
        slices: {
          ...curr.slices,
          [tab]: {
            ...curr.slices[tab],
            isLoading: false,
            error: msg,
            inFlight: undefined,
          },
        },
      }));
    }
  },
}));
