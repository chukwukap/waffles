"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useQuestActions } from "./_components/useQuestActions";
import { QUESTS, Quest, QuestId, QuestStatus } from "@/lib/quests";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import sdk from "@farcaster/miniapp-sdk";

// ============================================
// TYPES
// ============================================
export interface WaitlistData {
  fid: number;
  rank: number;
  points: number;
  inviteCode: string | null;
  invitesCount: number;
  status: string;
  completedTasks: string[];
}

export type { Quest, QuestId, QuestStatus };
export { QUESTS };

// ============================================
// FLOATING PARTICLES - Lighter version for quests
// ============================================
function QuestParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Subtle floating dots */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
          style={{
            left: `${15 + i * 10}%`,
            top: `${25 + (i % 4) * 20}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}
      {/* Glowing orbs */}
      <motion.div
        className="absolute w-48 h-48 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(0,207,242,0.06) 0%, transparent 70%)",
          right: "-10%",
          top: "20%",
        }}
        animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-40 h-40 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 70%)",
          left: "-5%",
          bottom: "30%",
        }}
        animate={{ x: [0, -10, 0], y: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ============================================
// PROGRESS BAR - Shows quest completion
// ============================================
function QuestProgress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percentage = Math.round((completed / total) * 100);

  return (
    <motion.div
      className="w-full mb-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-[#99A0AE] font-display text-sm">
          {completed}/{total} completed
        </span>
        <motion.span
          className="text-cyan-400 font-body text-lg"
          key={percentage}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {percentage}%
        </motion.span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-linear-to-r from-cyan-500 to-cyan-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        />
      </div>
    </motion.div>
  );
}

// ============================================
// POINTS DISPLAY - Total points earned
// ============================================
function PointsDisplay({ points }: { points: number }) {
  return (
    <motion.div
      className="flex items-center justify-center gap-2 mb-4"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, type: "spring" }}
    >
      <motion.span
        className="text-amber-400 font-body text-2xl"
        key={points}
        initial={{ scale: 1.5, color: "#4ade80" }}
        animate={{ scale: 1, color: "#fbbf24" }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {points}
      </motion.span>
      <span className="text-[#99A0AE] font-display text-sm">points earned</span>
    </motion.div>
  );
}

// ============================================
// QUEST CARD - Individual quest item
// ============================================
function QuestCard({
  quest,
  status,
  index,
  onGo,
  onComplete,
  isPending,
}: {
  quest: Quest;
  status: QuestStatus;
  index: number;
  onGo: () => void;
  onComplete: () => void;
  isPending: boolean;
}) {
  const isCompleted = status === "completed";
  const isPendingQuest = status === "pending";
  const isInitial = status === "initial";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: index * 0.08,
      }}
      whileTap={!isCompleted ? { scale: 0.98 } : undefined}
      className={cn(
        "relative flex items-center gap-3 px-3 py-3 rounded-2xl",
        "bg-white/[0.03] border border-white/10",
        "transition-colors duration-200",
        !isCompleted && "active:bg-white/[0.06]",
        isCompleted && "opacity-60"
      )}
    >
      {/* Completion glow effect */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-green-500/10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Icon with bounce */}
      <motion.div
        className="shrink-0 w-12 h-12 rounded-xl overflow-hidden relative"
        whileTap={{ scale: 0.9, rotate: -10 }}
      >
        <Image src={quest.iconPath} alt={quest.title} fill className="object-cover" />
      </motion.div>

      {/* Points Badge - animated */}
      <AnimatePresence>
        {!isInitial && (
          <motion.div
            className={cn(
              "absolute top-2 right-2 font-body font-normal text-lg leading-none",
              isCompleted ? "text-green-400" : "text-cyan-400"
            )}
            initial={{ opacity: 0, scale: 0, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {isCompleted ? "✓" : `+${quest.points}`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p
          className={cn(
            "font-body font-normal text-lg leading-tight",
            isCompleted
              ? "text-white/60 line-through decoration-white/40"
              : "text-white"
          )}
        >
          {quest.title}
        </p>
        <p className="font-display font-medium text-[13px] leading-tight text-[#99A0AE] line-clamp-2">
          {quest.text}
        </p>

        {/* Pending state - Complete button */}
        <AnimatePresence>
          {isPendingQuest && (
            <motion.button
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              onClick={onComplete}
              disabled={isPending}
              className={cn(
                "w-24 h-7 rounded-full",
                "bg-white text-[#1B8FF5]",
                "border border-[#1B8FF5]/30",
                "font-body font-normal text-base leading-none",
                "flex items-center justify-center",
                "transition-all duration-150",
                isPending && "opacity-50 cursor-not-allowed"
              )}
              whileTap={!isPending ? { scale: 0.95 } : undefined}
            >
              {isPending ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-[#1B8FF5]/30 border-t-[#1B8FF5] rounded-full"
                />
              ) : (
                "COMPLETE"
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Initial state - GO button */}
      <AnimatePresence>
        {isInitial && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={onGo}
            disabled={isPending}
            className={cn(
              "font-body font-normal text-xl text-cyan-400 px-2",
              "transition-all duration-150",
              !isPending && "active:text-cyan-300",
              isPending && "opacity-50 cursor-not-allowed"
            )}
            whileTap={!isPending ? { scale: 0.9 } : undefined}
          >
            GO
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export function QuestsPageClient() {
  const [waitlistData, setWaitlistData] = useState<WaitlistData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Optimistic points - tracks points added before server confirms
  const [optimisticPoints, setOptimisticPoints] = useState(0);
  const [optimisticCompleted, setOptimisticCompleted] = useState<string[]>([]);

  // Fetch waitlist data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await sdk.quickAuth.fetch("/api/v1/waitlist");
        if (!response.ok) {
          throw new Error("Failed to fetch waitlist data");
        }
        const data = await response.json();
        setWaitlistData(data);
        // Reset optimistic state when we get fresh data
        setOptimisticPoints(0);
        setOptimisticCompleted([]);
      } catch (err) {
        console.error("Error fetching waitlist data:", err);
        setError("Failed to load quests");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Initialize quest actions hook
  const { handleGo, handleComplete: originalHandleComplete, getQuestStatus, isPending } = useQuestActions({
    waitlistData: waitlistData ?? {
      fid: 0,
      rank: 0,
      points: 0,
      inviteCode: null,
      invitesCount: 0,
      status: "",
      completedTasks: [],
    },
  });

  // Wrap handleComplete to add optimistic points
  const handleComplete = (questId: string) => {
    // Find the quest to get its points
    const quest = QUESTS.find((q) => q.id === questId);
    if (quest && !optimisticCompleted.includes(questId)) {
      setOptimisticPoints((prev) => prev + quest.points);
      setOptimisticCompleted((prev) => [...prev, questId]);
    }
    // Call original handler
    originalHandleComplete(questId);
  };

  // Calculate total points (server + optimistic)
  const displayPoints = (waitlistData?.points ?? 0) + optimisticPoints;

  // Calculate completion stats (including optimistic)
  const completedCount = useMemo(() => {
    if (!waitlistData) return optimisticCompleted.length;
    const serverCompleted = QUESTS.filter(
      (q) => waitlistData.completedTasks.includes(q.id)
    ).length;
    // Add optimistic completions that aren't already in server data
    const additionalOptimistic = optimisticCompleted.filter(
      (id) => !waitlistData.completedTasks.includes(id)
    ).length;
    return serverCompleted + additionalOptimistic;
  }, [waitlistData, optimisticCompleted]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <WaffleLoader text="LOADING QUESTS..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error || !waitlistData) {
    return (
      <motion.div
        className="flex-1 flex flex-col items-center justify-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.span
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5, repeat: 3 }}
          className="text-4xl"
        >
          😕
        </motion.span>
        <p className="text-red-400 text-center">{error || "Failed to load quests"}</p>
      </motion.div>
    );
  }

  // ============================================
  // SUCCESS STATE
  // ============================================
  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* Background particles */}
      <QuestParticles />

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
        <div className="w-full max-w-lg mx-auto space-y-3">
          {/* Points & Progress */}
          <PointsDisplay points={displayPoints} />
          <QuestProgress completed={completedCount} total={QUESTS.length} />

          {/* Quest List */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {QUESTS.map((quest, index) => {
              const status = getQuestStatus(quest);
              return (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  status={status}
                  index={index}
                  onGo={() => handleGo(quest)}
                  onComplete={() => handleComplete(quest.id)}
                  isPending={isPending}
                />
              );
            })}
          </motion.div>

          {/* Completion message */}
          <AnimatePresence>
            {completedCount === QUESTS.length && (
              <motion.div
                className="text-center py-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.span
                  className="text-4xl block mb-2"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                >
                  🎉
                </motion.span>
                <p className="text-green-400 font-body text-lg">
                  All quests completed!
                </p>
                <p className="text-[#99A0AE] font-display text-sm">
                  You&apos;re a true Waffle warrior
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
