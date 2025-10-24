"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";

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
}

type LeaderboardAction =
  | { type: "SET_ACTIVE_TAB"; tab: TabKey }
  | { type: "SET_SLICE"; tab: TabKey; slice: Partial<Slice> }
  | { type: "MERGE_ENTRIES"; tab: TabKey; entries: Entry[]; append: boolean }
  | { type: "SET_ME"; entry: Entry | null }
  | { type: "RESET" };

const defaultSlice: Slice = {
  entries: [],
  page: 0,
  hasMore: true,
  isLoading: false,
  error: null,
  scrollTop: 0,
};

const initialState: LeaderboardState = {
  activeTab: "current",
  slices: {
    current: { ...defaultSlice },
    allTime: { ...defaultSlice },
  },
  me: null,
};

function mergeSlice(slice: Slice, patch: Partial<Slice>): Slice {
  return { ...slice, ...patch };
}

function leaderboardReducer(
  state: LeaderboardState,
  action: LeaderboardAction
): LeaderboardState {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.tab };
    case "SET_SLICE":
      return {
        ...state,
        slices: {
          ...state.slices,
          [action.tab]: mergeSlice(state.slices[action.tab], action.slice),
        },
      };
    case "MERGE_ENTRIES": {
      const existing = state.slices[action.tab];
      const entries = action.append
        ? [...existing.entries, ...action.entries]
        : action.entries;
      return {
        ...state,
        slices: {
          ...state.slices,
          [action.tab]: {
            ...existing,
            entries,
            page: action.append ? existing.page + 1 : 1,
          },
        },
      };
    }
    case "SET_ME":
      return { ...state, me: action.entry };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface LeaderboardContextValue extends LeaderboardState {
  setActiveTab: (tab: TabKey) => void;
  rememberScroll: (tab: TabKey, scrollY: number) => void;
  fetchLeaderboard: (
    tab: TabKey,
    opts?: { replace?: boolean }
  ) => Promise<void>;
  reset: () => void;
}

const LeaderboardContext =
  createContext<LeaderboardContextValue | undefined>(undefined);

export function LeaderboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(leaderboardReducer, initialState);

  const setActiveTab = useCallback((tab: TabKey) => {
    dispatch({ type: "SET_ACTIVE_TAB", tab });
  }, []);

  const rememberScroll = useCallback((tab: TabKey, scrollY: number) => {
    dispatch({
      type: "SET_SLICE",
      tab,
      slice: { scrollTop: scrollY },
    });
  }, []);

  const fetchLeaderboard = useCallback(
    async (tab: TabKey, opts?: { replace?: boolean }) => {
      const slice = state.slices[tab];
      if (!opts?.replace && (slice.isLoading || !slice.hasMore)) return;

      const targetPage = opts?.replace ? 0 : slice.page;

      dispatch({
        type: "SET_SLICE",
        tab,
        slice: {
          isLoading: true,
          error: null,
          ...(opts?.replace ? { entries: [], page: 0, hasMore: true } : {}),
        },
      });

      try {
        const res = await fetch(`/api/leaderboard?tab=${tab}&page=${targetPage}`);
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

        dispatch({
          type: "MERGE_ENTRIES",
          tab,
          entries: newEntries,
          append: !opts?.replace,
        });
        dispatch({
          type: "SET_SLICE",
          tab,
          slice: {
            hasMore: Boolean(data.hasMore),
            isLoading: false,
            error: null,
          },
        });

        if (data.me) {
          dispatch({
            type: "SET_ME",
            entry: {
              rank: data.me.rank,
              username: data.me.name,
              points: data.me.points,
              pfpUrl: data.me.imageUrl || null,
            },
          });
        }
      } catch (error) {
        console.error("fetchLeaderboard error:", error);
        dispatch({
          type: "SET_SLICE",
          tab,
          slice: {
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    },
    [state.slices]
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const value = useMemo<LeaderboardContextValue>(
    () => ({
      ...state,
      setActiveTab,
      rememberScroll,
      fetchLeaderboard,
      reset,
    }),
    [state, setActiveTab, rememberScroll, fetchLeaderboard, reset]
  );

  return (
    <LeaderboardContext.Provider value={value}>
      {children}
    </LeaderboardContext.Provider>
  );
}

export function useLeaderboard() {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error("useLeaderboard must be used within a LeaderboardProvider");
  }
  return context;
}
