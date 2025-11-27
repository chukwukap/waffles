"use client";

import { TrophyIcon, UsdcIcon } from "@/components/icons";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { LeaderboardEntry } from "@/lib/types";

interface Top3Props {
  entries: LeaderboardEntry[];
  currentUserId?: number | null; // This is the user's FID
}

const cardStyles = [
  {
    bg: "bg-gradient-to-r from-transparent via-yellow-500/5 to-yellow-500/15",
    border: "border-yellow-400/30",
    trophy: "#FFC931",
  },
  {
    bg: "bg-gradient-to-r from-transparent via-cyan-500/5 to-cyan-500/15",
    border: "border-cyan-400/30",
    trophy: "#19ABD3",
  },
  {
    bg: "bg-gradient-to-r from-transparent via-orange-500/5 to-orange-500/15",
    border: "border-orange-400/30",
    trophy: "#D34D19",
  },
];

export function Top3({ entries, currentUserId }: Top3Props) {
  const topEntries = entries?.slice(0, 3) ?? [];

  if (topEntries.length === 0) return null;

  return (
    <div
      className="
        flex w-full
        gap-(--gap)
      "
      style={
        {
          "--gap": "clamp(0.25rem, 2.2vw, 1rem)",
          "--pad": "clamp(0.5rem, 2.2vw, 1rem)",
          "--radius": "clamp(0.75rem, 2vw, 1rem)",
        } as React.CSSProperties
      }
    >
      {topEntries.map((entry, i) => {
        // BUG FIX: Compare currentUserId (FID) to entry.fid, not entry.id
        const isCurrentUser =
          currentUserId != null && entry.fid === currentUserId;
        const styles = cardStyles[i] ?? cardStyles[cardStyles.length - 1];

        const formattedPoints = entry.points.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        return (
          <article
            key={entry.rank ?? i}
            className={cn(
              "basis-1/3 min-w-0 flex-1",
              "rounded-(--radius) border",
              "p-(--pad) bg-clip-padding",
              "flex flex-col gap-[calc(var(--pad)*0.8)]",
              "transition-shadow hover:shadow-lg",
              styles.bg,
              styles.border,
              isCurrentUser &&
              "ring-2 ring-offset-2 ring-offset-black ring-blue-400"
            )}
          >
            <TrophyIcon
              color={styles.trophy}
              className="shrink-0"
              style={{
                width: "clamp(14px, 2.8vw, 20px)",
                height: "clamp(14px, 2.8vw, 20px)",
              }}
              aria-label={`Place ${i + 1}`}
            />

            <div className="flex min-w-0 items-center gap-[calc(var(--pad)*0.5)]">
              <div
                className="relative rounded-full bg-white/10 overflow-hidden shrink-0"
                style={{
                  width: "clamp(18px, 3vw, 24px)",
                  height: "clamp(18px, 3vw, 24px)",
                }}
              >
                {entry.pfpUrl ? (
                  <img
                    src={entry.pfpUrl}
                    alt={entry.username || "Unknown User"}
                    className="object-cover w-full h-full"
                    draggable={false}
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-[calc(var(--pad)*0.6)] font-bold text-white/70">
                    {entry.username?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <span
                title={entry.username || "Unknown User"}
                className="
                  min-w-0 truncate text-white font-body font-normal leading-tight
                "
                style={{ fontSize: "clamp(0.7rem, 2.3vw, 0.95rem)" }}
              >
                {entry.username}
              </span>
            </div>

            <div className="mt-auto flex items-center gap-[calc(var(--pad)*0.5)]">
              <UsdcIcon
                className="shrink-0"
                style={{
                  width: "clamp(14px, 2.8vw, 20px)",
                  height: "clamp(14px, 2.8vw, 20px)",
                }}
              />
              <span
                className="font-display font-medium tracking-tight leading-[1.1]"
                style={{ fontSize: "clamp(0.85rem, 2.6vw, 1rem)" }}
              >
                {formattedPoints}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
