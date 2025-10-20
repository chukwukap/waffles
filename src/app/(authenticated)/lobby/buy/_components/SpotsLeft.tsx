import * as React from "react";

type SpotsLeftProps = {
  current: number; // e.g. 23
  total: number; // e.g. 100
  subtitle?: string; // default: "spots left"
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
  subtitle = "spots left",
  avatars,
  className = "",
}: SpotsLeftProps) {
  // Limit to 4 items (per your mock). Provide rotation per index.
  const ROTATIONS = [-8.71, 5.85, -3.57, 7.56];

  // Clamp/format
  const clamped = Math.max(0, Math.min(current, total));

  return (
    <div
      className={`flex flex-col items-center gap-[12px] w-[228px] ${className}`}
      aria-label={`${clamped}/${total} ${subtitle}`}
    >
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
              transform: `rotate(${ROTATIONS[i] ?? 0}deg)`,
              backgroundImage: `url("${src}")`,
            }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Text block */}
      <div className="flex flex-col items-center w-[228px] h-[58px]">
        <div className="flex items-end justify-center text-sm text-foreground font-display">
          {clamped}/{total}
        </div>
        <div className="w-[228px] h-[21px] text-center tracking-[-0.03em] leading-[130%] text-[16px] font-medium font-display">
          {subtitle}
        </div>
      </div>
    </div>
  );
}
