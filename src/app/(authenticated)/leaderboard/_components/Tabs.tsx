"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PixelButton } from "@/components/buttons/PixelButton";
import { cn } from "@/lib/utils";

export type LeaderboardTabKey = "current" | "allTime";
const TABS: { key: LeaderboardTabKey; label: string }[] = [
  { key: "current", label: "Current game" },
  { key: "allTime", label: "All time" },
];

export function Tabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get("tab") || "current") as LeaderboardTabKey;

  const handleTabChange = useCallback(
    (newTab: LeaderboardTabKey) => {
      const params = new URLSearchParams(searchParams);
      params.set("tab", newTab);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="inline-flex items-center gap-2" role="tablist">
      {TABS.map(({ key, label }) => {
        const selected = activeTab === key;
        return (
          <PixelButton
            key={key}
            role="tab"
            aria-selected={selected}
            backgroundColor={selected ? "white" : ""}
            textColor={selected ? "black" : "var(--color-waffle-gold)"}
            borderColor={"var(--color-waffle-gold)"}
            onClick={() => handleTabChange(key)}
            borderWidth={4}
            className={cn(
              "px-4 py-2 text-xs sm:px-6 sm:py-2 sm:text-sm",
              selected ? "font-bold" : "opacity-80 hover:opacity-100",
              selected ? "" : "bg-[#191919] ",
              "transition"
            )}
            tabIndex={selected ? 0 : -1}
            disabled={selected}
          >
            {label}
          </PixelButton>
        );
      })}
    </div>
  );
}
