"use client";

import React, { useEffect, useRef } from "react";
import { useLeaderboardStore } from "@/stores/leaderboardStore";
import { DynamicHeader } from "./DynamicHeader";
import { LeaderboardControls } from "./LeaderboardControls";
import { LeaderboardList } from "./LeaderboardList";
import { AnimatePresence, motion } from "framer-motion";

export function LeaderboardScreen() {
  const scrollRef = useRef<HTMLUListElement>(null);
  const {
    activeTab,
    setActiveTab,
    fetchCurrentLeaderboard,
    fetchAllTimeLeaderboard,
  } = useLeaderboardStore();
  const { isLoading, error } = useLeaderboardStore((state) =>
    activeTab === "current"
      ? state.currentLeaderboard
      : state.allTimeLeaderboard
  );

  useEffect(() => {
    if (activeTab === "current") {
      fetchCurrentLeaderboard();
    } else {
      fetchAllTimeLeaderboard();
    }
  });

  return (
    <div className="mx-auto flex h-[100dvh] flex-col bg-figma noise">
      <DynamicHeader scrollRef={scrollRef as React.RefObject<HTMLElement>} />
      <LeaderboardControls activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="relative flex-grow overflow-hidden">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center"
            >
              <p className="text-text-secondary">Loading...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center"
            >
              <p className="text-red-500">{error}</p>
            </motion.div>
          ) : (
            <LeaderboardList
              key={activeTab}
              //   users={data}
              scrollRef={scrollRef as React.RefObject<HTMLUListElement>}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
