"use client";
import type { LeaderboardTabKey as TabKey } from "@/state";
import { PixelButton } from "@/components/buttons/PixelButton";

export function Tabs({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2" role="tablist">
      {(["current", "allTime"] as const).map((k) => {
        const selected = active === k;
        return (
          <PixelButton
            key={k}
            role="tab"
            aria-selected={selected}
            backgroundColor={selected ? "white" : ""}
            textColor={selected ? "black" : "var(--color-waffle-gold)"}
            borderColor={"var(--color-waffle-gold)"}
            onClick={() => onChange(k)}
            borderWidth={4}
            className={[
              // Responsive paddings and text size
              "px-4 py-2 text-xs sm:px-6 sm:py-2 sm:text-sm",
              selected ? "font-bold" : "opacity-80 hover:opacity-100",
              selected ? "noise" : "bg-figma noise",
              "transition",
            ].join(" ")}
            tabIndex={selected ? 0 : -1}
          >
            {k === "current" ? "Current game" : "All time"}
          </PixelButton>
        );
      })}
    </div>
  );
}
