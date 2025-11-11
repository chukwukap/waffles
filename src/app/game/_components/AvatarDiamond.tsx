"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

type Avatar = {
  id: string | number;
  src: string;
  alt?: string;
  opacity?: number;
};

type Props = {
  cellMin?: number;
  cellMax?: number;
  gap?: number;
  className?: string;
};

/**
 * Renders a fixed diamond pattern grid of avatars.
 * The pattern has 5 rows and 7 columns, with specific cells filled.
 * Purely presentational component.
 */
export function AvatarDiamond({
  cellMin = 32,
  cellMax = 54,
  gap = 2,
  className = "",
}: Props) {
  // Full player avatars list
  const diamondAvatars = useMemo(() => {
    const players = [
      { username: "Player 1", pfpUrl: "/images/lobby/1.jpg" },
      { username: "Player 2", pfpUrl: "/images/lobby/2.jpg" },
      { username: "Player 3", pfpUrl: "/images/lobby/3.jpg" },
      { username: "Player 4", pfpUrl: "/images/lobby/4.jpg" },
      { username: "Player 5", pfpUrl: "/images/lobby/5.jpg" },
      { username: "Player 6", pfpUrl: "/images/lobby/6.jpg" },
      { username: "Player 7", pfpUrl: "/images/lobby/7.jpg" },
      { username: "Player 8", pfpUrl: "/images/lobby/8.jpg" },
      { username: "Player 9", pfpUrl: "/images/lobby/9.jpg" },
      { username: "Player 10", pfpUrl: "/images/lobby/10.jpg" },
      { username: "Player 11", pfpUrl: "/images/lobby/11.jpg" },
      { username: "Player 12", pfpUrl: "/images/lobby/12.jpg" },
      { username: "Player 13", pfpUrl: "/images/lobby/13.jpg" },
      { username: "Player 14", pfpUrl: "/images/lobby/14.jpg" },
      { username: "Player 15", pfpUrl: "/images/lobby/14.jpg" },
      { username: "Player 16", pfpUrl: "/images/lobby/16.jpg" },
      { username: "Player 17", pfpUrl: "/images/lobby/17.jpg" },
      { username: "Player 18", pfpUrl: "/images/lobby/18.jpg" },
      { username: "Player 19", pfpUrl: "/images/lobby/19.jpg" },
      { username: "Player 20", pfpUrl: "/images/lobby/20.jpg" },
      { username: "Player 21", pfpUrl: "/images/lobby/21.jpg" },
      { username: "Player 22", pfpUrl: "/images/lobby/22.jpg" },
      { username: "Player 23", pfpUrl: "/images/lobby/23.jpg" },
      { username: "Player 24", pfpUrl: "/images/lobby/24.jpg" },
      { username: "Player 25", pfpUrl: "/images/lobby/25.jpg" },
    ];
    return players.map((player) => ({
      id: player.username,
      src: player.pfpUrl,
      alt: player.username,
    }));
  }, []);
  // Fixed pattern defining which grid cells (1-based column index) are filled in each row
  const pattern: number[][] = [
    [2, 4, 6], // Row 1
    [1, 3, 5, 7], // Row 2
    [2, 4, 6], // Row 3
    [1, 3, 5, 7], // Row 4
    [2, 4, 6], // Row 5
  ];
  // Calculate the total capacity of the diamond pattern
  const capacity = pattern.reduce((n, row) => n + row.length, 0);
  // Limit the input avatars to the diamond's capacity
  const data = diamondAvatars.slice(0, capacity);

  // Map the pattern to slot data including row, column, and avatar info
  const slots: { row: number; col: number; avatar?: Avatar }[] = [];
  let avatarIndex = 0;
  pattern.forEach((cols, rowIndex) => {
    cols.forEach((colIndex) => {
      slots.push({
        row: rowIndex + 1,
        col: colIndex,
        avatar: data[avatarIndex++],
      });
    });
  });

  // Define CSS variables for responsive sizing based on props
  const styleVariables = {
    "--cell": `clamp(${cellMin}px, 7.5vw, ${cellMax}px)`,
    "--tile": "calc(var(--cell) - 4px)",
    "--gap": `${gap}px`,
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        "relative grid gap-(--gap)",
        "grid-cols-[repeat(7,var(--cell))]",
        "auto-rows-(--cell)",
        className
      )}
      style={styleVariables}
      aria-label="Avatar grid"
      role="grid"
    >
      {slots.map((slot) => (
        <div
          key={`r${slot.row}-c${slot.col}`}
          role="gridcell"
          className="relative"
          style={{
            gridColumnStart: slot.col,
            gridRowStart: slot.row,
            opacity: slot.avatar?.opacity ?? 1,
          }}
          aria-hidden={!slot.avatar}
        >
          <Tile avatar={slot.avatar} />
        </div>
      ))}
    </div>
  );
}

/**
 * Internal component to render a single avatar tile within the diamond grid.
 */
function Tile({ avatar }: { avatar?: Avatar }) {
  // If no avatar data, render an empty div to maintain grid structure
  if (!avatar) return <div className="size-(--cell)" aria-hidden="true" />;

  return (
    <div className="relative size-(--cell)">
      <Image
        src={avatar.src}
        alt={avatar.alt ?? `Avatar ${avatar.id}`}
        fill
        sizes="var(--tile)"
        className="absolute left-[2px] top-[2px] size-(--tile) rounded-sm border border-[#464646] object-cover bg-[#F0F3F4]"
        draggable={false}
      />
      <span
        className="absolute left-0 top-0 size-1 bg-white/30"
        aria-hidden="true"
      />{" "}
      <span
        className="absolute right-0 top-0 size-1 bg-white/30"
        aria-hidden="true"
      />{" "}
      <span
        className="absolute right-0 bottom-0 size-1 bg-white/30"
        aria-hidden="true"
      />{" "}
      <span
        className="absolute left-0 bottom-0 size-1 bg-white/30"
        aria-hidden="true"
      />{" "}
    </div>
  );
}
