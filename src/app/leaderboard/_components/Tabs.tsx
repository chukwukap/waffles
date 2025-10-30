"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PixelButton } from "@/components/buttons/PixelButton";
import { cn } from "@/lib/utils";

export type LeaderboardTabKey = "current" | "allTime";

// The labels in your original code are already correct for the target design
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
    <div
      className="inline-flex justify-center gap-3 sm:gap-4 items-center"
      role="tablist"
      style={{ minHeight: 42 }}
    >
      {TABS.map(({ key, label }) => {
        const selected = activeTab === key;
        const styleOverrides: React.CSSProperties = {
          background: selected ? "#FFF8E1" : "#191919",
          color: selected ? "#191919" : "var(--color-waffle-gold)",
          whiteSpace: "nowrap",
          minWidth: 120,
          height: 42,
          fontWeight: selected ? 500 : 400,
          fontFamily: "var(--font-satoshi, inherit)",
          letterSpacing: 0,
          borderColor: "var(--color-waffle-gold)",
          borderWidth: 4,
        };

        return (
          <PixelButton
            key={key}
            role="tab"
            aria-selected={selected}
            onClick={() => handleTabChange(key)}
            tabIndex={selected ? 0 : -1}
            disabled={selected}
            className={cn(
              "font-body",
              "sm:text-[20px] text-base leading-[1.2]",
              "px-6 sm:px-6 py-1.5 sm:py-1.5",
              "transition whitespace-nowrap",
              "h-[42px] min-w-[120px] max-w-full justify-center items-center flex",
              selected
                ? "font-medium"
                : "font-normal opacity-80 hover:opacity-100"
            )}
            style={styleOverrides}
          >
            {label}
          </PixelButton>
        );
      })}
    </div>
  );
}
