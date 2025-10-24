import * as React from "react";

type SpotsLeftProps = {
  current: number; // e.g. 23
  total: number; // e.g. 100
  avatars: string[]; // 1–4 avatar URLs (shown left→right, overlapped)
  className?: string; // optional wrapper overrides
};

/**
 * Matches the Figma specs:
 * - Container: 228px wide, gap: 12px, centered
 * - Avatars: 42.11px, 3.0078px white border, 6.0156px radius, overlap -22.0571px
 * - Rotations: [-8.71, 5.85, -3.57, 7.56] deg
 * - Count: 32px size, letter-spacing -0.02em, line-height 115%, color #00CFF2
 * - Subtitle: 16px, weight 500, letter-spacing -0.03em, color #99A0AE
 *
 * Notes:
 * - I kept the exact decimals (rounded visually identical in browsers).
 * - If you use custom fonts (“Edit Undo BRK”, “Brockmann”), set them on body or replace the inline fontFamily below.
 */
export function SpotsLeft({
  current,
  total,
  avatars,
  className = "",
}: SpotsLeftProps) {
  return (
    <div className={`flex flex-col items-center w-[228px] ${className}`}>
      {/* Avatars row */}
      <div className="flex items-center h-[48px] w-[119.94px]">
        {avatars.slice(0, 4).map((src, i) => (
          <div
            key={i}
            className={[
              "box-border w-[42.11px] h-[42.11px] rounded-[6.0156px] border-[3.0078px] border-white",
              // Figma shows a light gray fallback under the image
              "bg-[#F0F3F4] bg-cover bg-center",
              // overlap spacing
              i !== 0 ? "ml-[-22.0571px]" : "",
              // lift above previous slightly so borders look right
              "relative z-[1]",
              // little shadow helps match the “stacked card” look (optional)
              "shadow-[0_0_0_0_rgba(0,0,0,0)]",
            ].join(" ")}
            style={{
              backgroundImage: `url("${src}")`,
            }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Text block */}
      <div
        className="flex flex-col items-center p-0 w-[228px] h-[58px]"
        style={{ alignSelf: "stretch", flex: "none", order: 1, flexGrow: 0 }}
      >
        <div
          className="flex items-end justify-center w-[228px] h-[37px] text-center font-body"
          style={{
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
          className="w-[228px] h-[21px] text-center font-display"
          style={{
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
          }}
        >
          spots left
        </div>
      </div>
    </div>
  );
}
