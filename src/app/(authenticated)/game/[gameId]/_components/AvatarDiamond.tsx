"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Avatar = {
  id: string | number;
  src: string;
  alt?: string;
  opacity?: number;
};

type Props = {
  avatars: Avatar[];
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
  avatars,
  cellMin = 32,
  cellMax = 54,
  gap = 2,
  className = "",
}: Props) {
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
  const data = avatars.slice(0, capacity);

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
