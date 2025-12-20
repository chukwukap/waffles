"use client";

import { GamePadIcon, WinningsIcon, WinsIcon } from "@/components/icons";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { ProfileStatsData } from "@/lib/types";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  index: number;
}

interface StatsProps {
  stats: ProfileStatsData | null;
  fid: number;
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
} as const;

export const StatCard = ({ icon, label, value, index }: StatCardProps) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
    whileTap={{ scale: 0.98 }}
    className={cn(
      "flex flex-1 flex-col justify-between",
      "noise rounded-2xl border border-white/20",
      "p-[1.25vh] px-2.5 gap-[1.25vh]",
      "min-h-[clamp(65px,9.5vh,85px)] transition-colors duration-300"
    )}
  >
    {/* Label */}
    <p
      className="font-display font-medium text-muted tracking-[-0.03em]"
      style={{
        fontSize: "clamp(0.75rem, 1.4vh, 0.8125rem)",
        lineHeight: "130%",
      }}
    >
      {label}
    </p>

    {/* Icon + Value */}
    <div className="flex items-center gap-1 sm:gap-1.5">
      <motion.span
        className="shrink-0 text-waffle-yellow"
        style={{ fontSize: "clamp(1rem, 2vh, 1.2rem)" }}
        whileHover={{ rotate: 15, scale: 1.2 }}
        aria-hidden
      >
        {icon}
      </motion.span>
      <p
        className="truncate font-body leading-none"
        style={{
          fontSize: "clamp(0.9rem, 2vh, 1.1rem)",
          lineHeight: "100%",
          letterSpacing: "-0.03em",
        }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  </motion.div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
} as const;

export function Stats({ stats, fid }: StatsProps) {
  const formattedWinnings = `$${(stats?.totalWon ?? 0).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;

  return (
    <section aria-labelledby="stats-heading" className="w-full">
      <div className="mb-[1.5vh] flex items-center justify-between font-semibold">
        <h2
          id="stats-heading"
          className="font-display font-medium text-muted tracking-[-0.03em]"
          style={{
            fontSize: "clamp(0.8125rem, 1.5vh, 1rem)",
            lineHeight: "130%",
          }}
        >
          Stats
        </h2>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/profile/stats"
            className="font-display font-medium text-waffle-gold tracking-[-0.03em] hover:underline"
            style={{
              fontSize: "clamp(0.8125rem, 1.4vh, 0.9375rem)",
              lineHeight: "130%",
            }}
          >
            View all
          </Link>
        </motion.div>
      </div>
      <motion.div
        className="grid grid-cols-3 gap-2"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <StatCard
          icon={<GamePadIcon className="w-[clamp(14px,2vh,18px)] h-[clamp(14px,2vh,18px)]" />}
          label="Games"
          value={stats?.totalGames ?? 0}
          index={0}
        />
        <StatCard
          icon={<WinsIcon className="w-[clamp(14px,2vh,18px)] h-[clamp(14px,2vh,18px)]" />}
          label="Wins"
          value={stats?.wins ?? 0}
          index={1}
        />
        <StatCard
          icon={<WinningsIcon className="w-[clamp(14px,2vh,18px)] h-[clamp(14px,2vh,18px)]" />}
          label="Winnings"
          value={formattedWinnings}
          index={2}
        />
      </motion.div>
    </section>
  );
}
