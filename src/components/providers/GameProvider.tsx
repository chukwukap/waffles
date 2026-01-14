/**
 * GameProvider - Backwards Compatibility Re-export
 *
 * This file re-exports from RealtimeProvider for backwards compatibility.
 * New code should import from RealtimeProvider directly.
 *
 * @deprecated Use RealtimeProvider instead. Game data should be fetched
 * in server components and passed as props to client components.
 */

"use client";

// Re-export everything from RealtimeProvider
export {
  RealtimeProvider,
  RealtimeProvider as GameProvider,
  useRealtime,
  useRealtime as useGame,
  type RealtimeState,
  type RealtimeContextValue,
  type RecentPlayer,
  type GameEntryData,
} from "./RealtimeProvider";

// Re-export GameWithQuestionCount from the game library
export type { GameWithQuestionCount } from "@/lib/game";
