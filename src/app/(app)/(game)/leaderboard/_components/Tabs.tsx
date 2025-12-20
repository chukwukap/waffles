"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PixelButton } from "@/components/ui/PixelButton";
import { motion } from "framer-motion";

export type LeaderboardTabKey = "current" | "allTime";

const TABS: { key: LeaderboardTabKey; label: string }[] = [
  { key: "current", label: "Current game" },
  { key: "allTime", label: "All time" },
];

interface TabsProps {
  activeTab: LeaderboardTabKey;
  fid: number | null;
}

export function Tabs({ activeTab, fid }: TabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = useCallback(
    (newTab: LeaderboardTabKey) => {
      const params = new URLSearchParams();
      params.set("tab", newTab);
      if (fid) {
        params.set("fid", fid.toString());
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, fid]
  );

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="inline-flex justify-center gap-3 sm:gap-4 items-center"
      role="tablist"
    >
      {TABS.map(({ key, label }) => {
        const isActive = activeTab === key;
        return (
          <div key={key} className="relative">
            <PixelButton
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(key)}
              tabIndex={isActive ? 0 : -1}
              variant={isActive ? "filled" : "outline"}
              width={140}
              height={40}
            >
              <span className="relative z-10">{label}</span>
            </PixelButton>
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-waffle-yellow"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
