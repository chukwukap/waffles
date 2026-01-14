"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useQuestActions } from "./_components/useQuestActions";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

// ============================================
// TYPES
// ============================================
export interface Quest {
  id: number;
  slug: string;
  title: string;
  description: string;
  iconUrl: string | null;
  category: string;
  points: number;
  type: string;
  actionUrl: string | null;
  castHash: string | null;
  requiredCount: number;
  repeatFrequency: string;
  isCompleted: boolean;
  isPending: boolean;
  progress: number;
}

export type QuestStatus = "initial" | "pending" | "completed";

export interface WaitlistData {
  fid: number;
  rank: number;
  points: number;
  inviteCode: string | null;
  invitesCount: number;
  hasGameAccess: boolean;
  joinedWaitlistAt: Date | null;
  completedQuests: string[];
  quests: Quest[];
}

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
// QUEST CARD - Individual quest item
// ============================================
function QuestCard({
  quest,
  status,
  index,
  onGo,
  onComplete,
  isPending,
  invitesCount,
}: {
  quest: Quest;
  status: QuestStatus;
  index: number;
  onGo: () => void;
  onComplete: () => void;
  isPending: boolean;
  invitesCount?: number;
}) {
  const isCompleted = status === "completed";
  const isPendingQuest = status === "pending";
  const isInitial = status === "initial";
  const isInviteQuest = quest.type === "invite";

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
        "bg-white/3 border border-white/10",
        "transition-colors duration-200",
        !isCompleted && "active:bg-white/6",
        isCompleted && "opacity-60"
      )}
    >
      {/* Icon with bounce */}
      <motion.div
        className="shrink-0 w-12 h-12 rounded-xl overflow-hidden relative"
        whileTap={{ scale: 0.9, rotate: -10 }}
      >
        <Image
          src={quest.iconUrl || "/images/icons/default.png"}
          alt={quest.title}
          fill
          className="object-cover"
        />
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
          {quest.description}
        </p>

        {/* Invite quest progress indicator */}
        {isInviteQuest && !isCompleted && (
          <span className="text-[12px] font-display text-white/50 mt-1">
            {Math.min(invitesCount ?? 0, 3)}/3 friends joined
          </span>
        )}

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
                "w-24 h-7 py-0.5 rounded-[8px]",
                "bg-white text-[#1B8FF5]",
                "border-[3px] border-t-0 border-l-0 border-[#1B8FF5]",
                "font-body font-normal text-base leading-none uppercase",
                "flex items-center justify-center",
                "transition-colors",
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

      {/* Initial state - GO/SHARE button */}
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
            {isInviteQuest ? "SHARE" : "GO"}
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
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const [waitlistData, setWaitlistData] = useState<WaitlistData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Optimistic completed - tracks completed quests before server confirms
  const [optimisticCompleted, setOptimisticCompleted] = useState<string[]>([]);

  // Fetch waitlist data on mount
  useEffect(() => {
    async function fetchData() {
      if (!fid) return;
      try {
        const response = await fetch(`/api/v1/waitlist?fid=${fid}`);
        if (!response.ok) {
          throw new Error("Failed to fetch waitlist data");
        }
        const data = await response.json();
        setWaitlistData(data);
        setOptimisticCompleted([]);
      } catch (err) {
        console.error("Error fetching waitlist data:", err);
        setError("Failed to load quests");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [fid]);

  // Initialize quest actions hook
  const {
    handleGo,
    handleComplete: originalHandleComplete,
    getQuestStatus,
    isPending,
  } = useQuestActions({
    waitlistData: waitlistData ?? {
      fid: 0,
      rank: 0,
      points: 0,
      inviteCode: null,
      invitesCount: 0,
      hasGameAccess: false,
      joinedWaitlistAt: null,
      completedQuests: [],
      quests: [],
    },
  });

  // Wrap handleComplete for optimistic UI updates
  const handleComplete = (questId: string) => {
    if (!optimisticCompleted.includes(questId)) {
      setOptimisticCompleted((prev) => [...prev, questId]);
    }
    originalHandleComplete(questId);
  };

  // Calculate completion stats (including optimistic)
  const completedCount = useMemo(() => {
    if (!waitlistData?.quests) return optimisticCompleted.length;
    const serverCompleted = waitlistData.quests.filter((q) =>
      waitlistData.completedQuests.includes(q.slug)
    ).length;
    // Add optimistic completions that aren't already in server data
    const additionalOptimistic = optimisticCompleted.filter(
      (slug) => !waitlistData.completedQuests.includes(slug)
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
        <p className="text-red-400 text-center">
          {error || "Failed to load quests"}
        </p>
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
          {/* Quest List */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {waitlistData.quests.map((quest, index) => {
              const status = getQuestStatus(quest);
              return (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  status={status}
                  index={index}
                  onGo={() => handleGo(quest)}
                  onComplete={() => handleComplete(quest.slug)}
                  isPending={isPending}
                  invitesCount={waitlistData.invitesCount}
                />
              );
            })}
          </motion.div>

          {/* Completion message */}
          <AnimatePresence>
            {completedCount === waitlistData.quests.length && (
              <motion.div
                className="text-center py-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.span
                  className="text-4xl block mb-2"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
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
