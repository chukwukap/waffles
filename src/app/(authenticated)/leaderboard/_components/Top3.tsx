import { LeaderboardEntry as Entry } from "@/state";
import { TrophyIcon, UsdcIcon } from "@/components/icons";

/** Top3: fixed single row (no wrap), fully responsive, no overflow */
export function Top3({ entries }: { entries: Entry[] }) {
  if (!entries?.length) return null;

  const cardStyles = [
    {
      bg: "bg-gradient-to-r from-transparent to-[rgba(52,199,89,0.12)]",
      trophy: "#34C759",
    },
    {
      bg: "bg-gradient-to-r from-transparent to-[rgba(25,171,211,0.12)]",
      trophy: "#19ABD3",
    },
    {
      bg: "bg-gradient-to-r from-transparent to-[rgba(211,77,25,0.12)]",
      trophy: "#D34D19",
    },
  ];

  return (
    <div
      className="
        flex w-full flex-nowrap items-stretch
        /* gap collapses on tiny screens, grows on wide */
        gap-[var(--gap)]
      "
      style={
        {
          // tune spacing & padding with CSS vars (works with Tailwind arbitrary values)
          ["--gap"]: "clamp(0.25rem, 2.2vw, 1rem)",
          ["--pad"]: "clamp(0.5rem, 2.2vw, 1rem)",
          ["--radius"]: "clamp(0.75rem, 2vw, 1rem)",
        } as React.CSSProperties
      }
    >
      {entries.slice(0, 3).map((entry, i) => (
        <article
          key={entry.rank}
          className={[
            "basis-1/3 min-w-0 flex-1",
            "rounded-[var(--radius)] border border-white/10",
            "p-[var(--pad)] bg-clip-padding",
            "flex flex-col gap-[calc(var(--pad)*1)]",
            "transition-shadow hover:shadow-lg",
            cardStyles[i]?.bg ?? "",
          ].join(" ")}
        >
          {/* trophy */}
          <TrophyIcon
            color={cardStyles[i]?.trophy}
            className="flex-shrink-0"
            style={{
              width: "clamp(14px, 2.8vw, 20px)",
              height: "clamp(14px, 2.8vw, 20px)",
            }}
            aria-label={`Place ${i + 1}`}
          />

          {/* avatar + name */}
          <div className="flex min-w-0 items-center gap-[calc(var(--pad)*0.5)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.pfpUrl || "/avatar.png"}
              alt={entry.username}
              draggable={false}
              className="rounded-full bg-[#F0F3F4] object-cover flex-shrink-0"
              style={{
                width: "clamp(18px, 3vw, 24px)",
                height: "clamp(18px, 3vw, 24px)",
              }}
            />
            <span
              title={entry.username}
              className="
                min-w-0 truncate text-white font-body font-normal leading-tight
              "
              style={{ fontSize: "clamp(0.7rem, 2.3vw, 0.95rem)" }}
            >
              {entry.username}
            </span>
          </div>

          {/* score */}
          <div className="mt-auto flex items-center gap-[calc(var(--pad)*0.5)]">
            <UsdcIcon
              className="flex-shrink-0"
              style={{
                width: "clamp(14px, 2.8vw, 20px)",
                height: "clamp(14px, 2.8vw, 20px)",
              }}
            />
            <span
              className="font-display font-medium tracking-tight leading-[1.1]"
              style={{ fontSize: "clamp(0.85rem, 2.6vw, 1rem)" }}
            >
              {entry.points.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
