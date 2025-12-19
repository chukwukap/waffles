"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PixelButton } from "@/components/ui/PixelButton";

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
    <div
      className="inline-flex justify-center gap-3 sm:gap-4 items-center"
      role="tablist"
    >
      {TABS.map(({ key, label }) => {
        const isActive = activeTab === key;
        return (
          <PixelButton
            key={key}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleTabChange(key)}
            tabIndex={isActive ? 0 : -1}
            variant={isActive ? "filled" : "outline"}
            width={164}
            height={40}
          >
            {label}
          </PixelButton>
        );
      })}
    </div>
  );
}
