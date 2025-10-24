import * as React from "react";

type SpotsLeftProps = {
  current: number; // e.g. 23
  total: number; // e.g. 100
  avatars: string[]; // 1–4 avatar URLs (shown left→right, overlapped)
  className?: string; // optional wrapper overrides
};

// Exact Figma avatar card rotations for up to 4 avatars
const AVATAR_ROTATIONS = [-8.71, 5.85, -3.57, 7.56];

export function SpotsLeft({
  current,
  total,
  avatars,
  className = "",
}: SpotsLeftProps) {
  return (
    <div
      className={`flex flex-col items-center p-0 gap-[12px] w-[228px] h-[118px] relative ${className}`}
      style={
        {
          // These absolute position props should be set only if used in a specifically positioned container
          //left: 82, top: 602,
        }
      }
    >
      {/* Avatars row, visually stacked and rotated */}
      <div
        className="flex flex-row items-center p-0 w-[119.94px] h-[48px] relative"
        style={{
          flex: "none",
          order: 0,
          flexGrow: 0,
        }}
      >
        {avatars.slice(0, 4).map((src, i) => (
          <div
            key={i}
            className="box-border bg-[#F0F3F4] border-white border-[3.00779px] rounded-[6.01558px] w-[42.11px] h-[42.11px] bg-cover bg-center"
            style={{
              marginLeft: i === 0 ? 0 : -22.0571,
              zIndex: i,
              backgroundImage: `url("${src}")`,
              transform: `rotate(${AVATAR_ROTATIONS[i] ?? 0}deg)`,
              flex: "none",
              order: i,
              flexGrow: 0,
              // Optional: white "card" border on the outside, gray underlay in case avatar fails
              // Box-shadow removed, as Figma shows no visible shadow
            }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Text block: count and "spots left" */}
      <div
        className="flex flex-col items-center p-0 w-[228px] h-[58px]"
        style={{
          flex: "none",
          order: 1,
          alignSelf: "stretch",
          flexGrow: 0,
        }}
      >
        <div
          className="flex items-end justify-center w-[228px] h-[37px] text-center"
          style={{
            fontFamily: "'Edit Undo BRK', var(--font-body, sans-serif)",
            fontStyle: "normal",
            fontWeight: 400,
            fontSize: "32px",
            lineHeight: "115%",
            letterSpacing: "-0.02em",
            color: "#00CFF2",
            alignSelf: "stretch",
            flex: "none",
            order: 0,
            flexGrow: 0,
          }}
        >
          {current}/{total}
        </div>
        <div
          className="w-[228px] h-[21px] text-center"
          style={{
            fontFamily: "'Brockmann', var(--font-display, sans-serif)",
            fontStyle: "normal",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: "130%",
            letterSpacing: "-0.03em",
            color: "#99A0AE",
            alignSelf: "stretch",
            flex: "none",
            order: 1,
            flexGrow: 0,
            marginTop: 0,
          }}
        >
          spots left
        </div>
      </div>
    </div>
  );
}
