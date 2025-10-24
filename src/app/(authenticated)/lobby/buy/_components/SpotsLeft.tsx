import * as React from "react";

type SpotsLeftProps = {
  current: number;
  total: number;
  avatars: string[];
  className?: string;
};

const FALLBACK_AVATARS = [
  "/images/avatars/a.png",
  "/images/avatars/b.png",
  "/images/avatars/c.png",
  "/images/avatars/d.png",
] as const;

export function SpotsLeft({
  current,
  total,
  avatars,
  className = "",
}: SpotsLeftProps) {
  const clampedCurrent = Math.max(0, Math.min(current, total));
  const displayedAvatars = React.useMemo(
    () => {
      const sanitized = avatars
        .filter(Boolean)
        .slice(0, 4)
        .map((src, index) => src || FALLBACK_AVATARS[index] || FALLBACK_AVATARS[0]);
      if (sanitized.length > 0) {
        return sanitized;
      }
      return Array.from({ length: 4 }, (_, index) => FALLBACK_AVATARS[index]);
    },
    [avatars]
  );

  return (
    <div
      className={[
        "flex w-full max-w-[260px] flex-col items-center gap-3 text-center",
        className,
      ].join(" ")}
    >
      <div className="flex -space-x-4">
        {displayedAvatars.map((src, index) => (
          <span
            key={`${src}-${index}`}
            className="inline-flex size-12 items-center justify-center rounded-xl border border-white/10 bg-[#0E0E11] shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            aria-hidden="true"
          />
        ))}
      </div>

      <div>
        <p className="font-edit-undo text-[clamp(1.5rem,5vw,2.25rem)] leading-none text-[#00CFF2]">
          {clampedCurrent}/{total}
        </p>
        <p className="text-sm font-display uppercase tracking-[0.2em] text-[#99A0AE]">
          spots left
        </p>
      </div>
    </div>
  );
}
