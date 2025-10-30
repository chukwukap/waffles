import Image from "next/image";
import clsx from "clsx";
import Link from "next/link";
import { FlashIcon } from "@/components/icons";

// The medal SVGs (using public paths)
const TROPHY_PATHS = [
  "/images/trophies/gold.svg",
  "/images/trophies/silver.svg",
  "/images/trophies/bronze.svg",
];

// Background color themes for top 3 positions to match the design
const THEMES = [
  "bg-gradient-to-r from-[#211900] to-[#092009] border-[#F4C542]/30", // Gold/green for 1st
  "bg-gradient-to-r from-[#22252E] to-[#14273E] border-[#BCCBEF]/25", // Silver/blue for 2nd
  "bg-gradient-to-r from-[#3D2313] to-[#18100B] border-[#FFA95C]/30", // Bronze/orange for 3rd
];

interface Entry {
  username: string;
  avatarUrl?: string | null;
  score: number;
}

interface Props {
  entries: Entry[];
  className?: string;
}

export default function Leaderboard({ entries, className }: Props) {
  return (
    <div
      className={clsx("w-full max-w-[420px] flex flex-col gap-3", className)}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-body text-[22px]">TOP 3 FINISHERS</h2>
        <Link
          href="/leaderboard"
          className="text-[#00CFF2] font-body text-[18px]"
        >
          VIEW LEADERBOARD
        </Link>
      </div>
      {entries.slice(0, 3).map((e, i) => (
        <div
          key={e.username}
          className={clsx(
            // Themed dark gradient backgrounds & border per position
            "flex items-center justify-between rounded-2xl p-3 min-h-[56px] border shadow-lg",
            THEMES[i] || THEMES[2]
          )}
        >
          {/* Trophy icon */}
          <span className="mr-4 flex-shrink-0 flex items-center w-[38px] h-[49px]">
            <Image
              src={TROPHY_PATHS[i] || TROPHY_PATHS[2]}
              width={38}
              height={49}
              alt=""
              priority
              unoptimized
            />
          </span>
          {/* User info (avatar and username) */}
          <span className="flex items-center gap-3 flex-1 min-w-0">
            <Image
              src={e.avatarUrl ?? "/images/avatar-default.png"}
              width={36}
              height={36}
              alt=""
              className="rounded-full border-2 border-white/20"
            />
            <span className="font-body text-[18px] text-white truncate">
              {e.username}
            </span>
          </span>
          {/* Score with lightning icon */}
          <span className="flex items-center gap-2 min-w-[90px] justify-end">
            <FlashIcon className="w-5 h-5 text-[#FFC931]" />
            <span className="font-body text-[22px] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.24)]">
              {e.score.toLocaleString()}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
