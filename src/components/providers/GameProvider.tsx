"use client";

import { ReactNode, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useSyncUser } from "@/hooks/useSyncUser";

export function GameProvider({ children }: { children: ReactNode }) {
  useSyncUser();
  const fetchActiveGame = useGameStore((s) => s.fetchActiveGame);

  useEffect(() => {
    fetchActiveGame();
  }, [fetchActiveGame]);

  return <>{children}</>;
}
