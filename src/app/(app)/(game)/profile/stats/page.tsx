"use client";

import { useProfile } from "../ProfileProvider";
import { cn } from "@/lib/utils";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { BottomNav } from "@/components/BottomNav";
import { SubHeader } from "@/components/ui/SubHeader";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// COMPONENT
// ==========================================

export default function StatsPage() {
  const { stats, isLoading } = useProfile();

  if (isLoading) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex items-center justify-center"
        >
          <WaffleLoader text="LOADING STATS..." />
        </motion.div>
        <BottomNav />
      </AnimatePresence>
    );
  }

  if (!stats) {
    return (
      <>
        <SubHeader title="ALL STATS" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/40 font-display">No stats available</p>
        </div>
        <BottomNav />
      </>
    );
  }

  const formattedWinnings = `$${stats.totalWon.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

  const formattedWinRate = `${stats.winRate.toFixed(0)}%`;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  } as const;

  return (
    <>
      <SubHeader title="ALL STATS" />
      <motion.main
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={cn(
          "mx-auto w-full max-w-lg flex-1",
          "px-4",
          "flex flex-col gap-[2.5vh]",
          "mt-[2vh]"
        )}
      >
        {/* Main Stats Grid */}
        <section
          className={cn(
            "grid grid-cols-2 gap-x-3 gap-y-[1.5vh] justify-items-center",
            "w-full max-w-lg",
            "rounded-2xl border border-white/20",
            "py-[2.5vh] px-3"
          )}
        >
          <LargeStat label="Total games" value={stats.totalGames} delay={0.2} />
          <LargeStat label="Wins" value={stats.wins} delay={0.3} />
          <LargeStat label="Win rate" value={formattedWinRate} delay={0.4} />
          <LargeStat label="Total won" value={formattedWinnings} delay={0.5} />
        </section>

        {/* Secondary Stats Grid */}
        <section
          className={cn(
            "grid grid-cols-2 gap-x-6 gap-y-[2.5vh] justify-items-center",
            "w-full max-w-lg",
            "rounded-2xl border border-white/20",
            "py-[2.5vh] px-3"
          )}
        >
          <IconStatCard
            icon="/images/icons/trophy.svg"
            label="Highest score"
            value={stats.highestScore}
            delay={0.6}
          />
          <IconStatCard
            icon="/images/icons/average.svg"
            label="Average score"
            value={stats.avgScore}
            delay={0.7}
          />
          <IconStatCard
            icon="/images/icons/streak-flame.svg"
            label="Current streak"
            value={stats.currentStreak}
            delay={0.8}
          />
          <IconStatCard
            icon="/images/icons/rank.svg"
            label="Best rank"
            value={stats.bestRank ?? "-"}
            delay={0.9}
          />
        </section>
      </motion.main>
      <BottomNav />
    </>
  );
}

const LargeStat = ({
  label,
  value,
  delay
}: {
  label: string;
  value: string | number;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
    whileHover={{ scale: 1.05 }}
    className="flex flex-col items-center justify-center gap-[0.5vh] w-full h-[clamp(55px,8vh,75px)] px-2"
  >
    <p
      className="text-muted font-display font-medium tracking-[-0.03em] text-center"
      style={{ fontSize: "clamp(0.8125rem, 1.4vh, 1rem)" }}
    >
      {label}
    </p>
    <p
      className="text-white font-body font-normal tracking-normal text-center"
      style={{ fontSize: "clamp(1.5rem, 3.8vh, 2.375rem)" }}
    >
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>
  </motion.div>
);

const IconStatCard = ({
  icon,
  label,
  value,
  delay
}: {
  icon: string;
  label: string;
  value: string | number;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
    whileHover={{ y: -5 }}
    className="flex h-[clamp(80px,11vh,105px)] w-full flex-col items-center justify-center gap-[0.25vh] px-2"
  >
    <motion.div
      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
      transition={{ duration: 0.5 }}
      className="shrink-0"
    >
      <Image
        src={icon}
        alt=""
        width={36}
        height={36}
        className="w-[clamp(28px,4vh,36px)] h-[clamp(28px,4vh,36px)]"
        priority={false}
      />
    </motion.div>
    <p
      className="font-display font-medium leading-[130%] tracking-[-0.03em] text-center text-[#99A0AE]"
      style={{ fontSize: "clamp(0.8125rem, 1.4vh, 1rem)" }}
    >
      {label}
    </p>
    <p
      className="font-body font-normal tracking-normal text-white text-center"
      style={{ fontSize: "clamp(1.5rem, 3.8vh, 2.375rem)" }}
    >
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>
  </motion.div>
);
