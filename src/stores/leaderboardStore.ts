"use client";
import { create } from "zustand";

export type TabKey = "current" | "allTime";

export interface Entry {
  rank: number;
  username: string;
  points: number;
  pfpUrl: string | null;
}

interface Slice {
  entries: Entry[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error?: string | null;
  scrollTop?: number;
}

interface LeaderboardState {
  activeTab: TabKey;
  slices: Record<TabKey, Slice>;
  me: Entry | null;

  // Actions
  setActiveTab: (tab: TabKey) => void;
  rememberScroll: (tab: TabKey, scrollY: number) => void;
  fetchLeaderboard: (tab: TabKey) => Promise<void>;
  reset: () => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  activeTab: "current",
  slices: {
    current: {
      entries: [],
      page: 0,
      hasMore: true,
      isLoading: false,
      scrollTop: 0,
    },
    allTime: {
      entries: [],
      page: 0,
      hasMore: true,
      isLoading: false,
      scrollTop: 0,
    },
  },
  me: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  rememberScroll: (tab, scrollY) =>
    set((state) => ({
      slices: {
        ...state.slices,
        [tab]: { ...state.slices[tab], scrollTop: scrollY },
      },
    })),

  fetchLeaderboard: async (tab) => {
    const { slices } = get();
    const slice = slices[tab];

    if (slice.isLoading || !slice.hasMore) return;

    set({
      slices: {
        ...slices,
        [tab]: { ...slice, isLoading: true, error: null },
      },
    });

    try {
      const res = await fetch(`/api/leaderboard?tab=${tab}&page=${slice.page}`);
      if (!res.ok) throw new Error(`Failed to fetch ${tab} leaderboard`);
      const data = await res.json();

      const newEntries: Entry[] = (data.users || []).map(
        (u: {
          rank: number;
          name: string;
          points: number;
          imageUrl: string | null;
        }) => ({
          rank: u.rank,
          username: u.name,
          points: u.points,
          pfpUrl: u.imageUrl || null,
        })
      );

      set((state) => ({
        slices: {
          ...state.slices,
          [tab]: {
            ...state.slices[tab],
            entries: [...state.slices[tab].entries, ...newEntries],
            page: state.slices[tab].page + 1,
            hasMore: data.hasMore,
            isLoading: false,
          },
        },
        me: data.me
          ? {
              rank: data.me.rank,
              username: data.me.name,
              points: data.me.points,
              pfpUrl: data.me.imageUrl || null,
            }
          : state.me,
      }));
    } catch (err: unknown) {
      set((state) => ({
        slices: {
          ...state.slices,
          [tab]: {
            ...state.slices[tab],
            isLoading: false,
            error: err instanceof Error ? err.message : "Unknown error",
          },
        },
      }));
    }
  },

  reset: () =>
    set({
      slices: {
        current: {
          entries: [],
          page: 0,
          hasMore: true,
          isLoading: false,
          scrollTop: 0,
        },
        allTime: {
          entries: [],
          page: 0,
          hasMore: true,
          isLoading: false,
          scrollTop: 0,
        },
      },
      me: null,
    }),
}));
