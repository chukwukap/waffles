"use client";

import { ReactNode, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";

export function GameProvider({ children }: { children: ReactNode }) {
  const fetchActiveGame = useGameStore((s) => s.fetchActiveGame);

  useEffect(() => {
    fetchActiveGame();
  }, [fetchActiveGame]);

  return <>{children}</>;
}
