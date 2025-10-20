import * as React from "react";
import Image from "next/image";

type Avatar = {
  id: string | number;
  src: string;
  alt?: string;
  // optional per-tile opacity (e.g. 0.2 / 0.6 / 0.7 like in the mock)
  opacity?: number;
};

type Props = {
  avatars: Avatar[]; // supply as many as you have; we’ll clip to capacity
  // visual controls
  cellMin?: number; // min outer square size
  cellMax?: number; // max outer square size
  gap?: number; // gap between squares
  className?: string;
};

/**
 * Renders a fixed “diamond” pattern:
 * rows: 5  | cols: 7
 * counts per row: 3,4,3,4,3 at columns [2,4,6] / [1,3,5,7] repeating.
 */
export function AvatarDiamond({
  avatars,
  cellMin = 32,
  cellMax = 54,
  gap = 8,
  className = "",
}: Props) {
  // where tiles live (1-based columns)
  const pattern: number[][] = [
    [2, 4, 6],
    [1, 3, 5, 7],
    [2, 4, 6],
    [1, 3, 5, 7],
    [2, 4, 6],
  ];
  const capacity = pattern.reduce((n, row) => n + row.length, 0);
  const data = avatars.slice(0, capacity); // clamp to visible capacity

  // compute per-slot metadata (row, col, avatar)
  const slots: { row: number; col: number; avatar?: Avatar }[] = [];
  let i = 0;
  pattern.forEach((cols, r) => {
    cols.forEach((c) => {
      slots.push({ row: r + 1, col: c, avatar: data[i++] });
    });
  });

  // CSS variables (responsive size)
  const style = {
    // outer cell size (34px in Figma -> responsive here)
    ["--cell" as keyof React.CSSProperties]: `clamp(${cellMin}px, 7.5vw, ${cellMax}px)`,
    // inner image size (30px in Figma)
    ["--tile" as keyof React.CSSProperties]: "calc(var(--cell) - 4px)",
    // gap
    ["--gap" as keyof React.CSSProperties]: `${gap}px`,
  };

  return (
    <div
      className={[
        "relative",
        // 7 equal columns, fixed 5 rows, with gaps
        "grid [grid-template-columns:repeat(7,var(--cell))] [grid-auto-rows:var(--cell)]",
        "gap-[var(--gap)]",
        className,
      ].join(" ")}
      style={style}
      aria-label="Avatar grid"
      role="grid"
    >
      {slots.map((slot) => (
        <div
          key={`${slot.row}-${slot.col}`}
          role="gridcell"
          // place item in the right row/column (1-based)
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

function Tile({ avatar }: { avatar?: Avatar }) {
  // empty slots are simply transparent (keeps the shape)
  if (!avatar) return <div className="w-[var(--cell)] h-[var(--cell)]" />;

  return (
    <div className="relative w-[var(--cell)] h-[var(--cell)]">
      {/* 30px image + 1px border on a 34px cell in the design */}
      <Image
        src={avatar.src}
        alt={avatar.alt ?? ""}
        width={30}
        height={30}
        className="absolute left-1 top-1 size-[var(--tile)] rounded-sm border border-[#464646] object-cover bg-[#F0F3F4]"
        draggable={false}
      />
      {/* 4 corner nubs (4x4, 1px inset from the edges) */}
      <span className="absolute left-0 top-0 size-1 bg-white/30" />
      <span className="absolute right-0 top-0 size-1 bg-white/30" />
      <span className="absolute right-0 bottom-0 size-1 bg-white/30" />
      <span className="absolute left-0 bottom-0 size-1 bg-white/30" />
    </div>
  );
}
