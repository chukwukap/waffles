import Image from "next/image";
import { FlashIcon, TrendIcon } from "@/components/icons";

interface Props {
  winnings: number;
  score: number;
  rank: number;
  username: string;
  avatarUrl: string;
}

function getTrophy(rank: number) {
  if (rank === 1) return "/images/trophies/gold.svg";
  if (rank === 2) return "/images/trophies/silver.svg";
  if (rank === 3) return "/images/trophies/bronze.svg";
  return "/images/trophies/participant.svg";
}

export default function WinningsCard({
  winnings,
  score,
  rank,
  username,
  avatarUrl,
}: Props) {
  const trophy = getTrophy(rank);

  return (
    <div
      className="
        w-full max-w-sm
        rounded-3xl
        p-4 sm:p-5
        bg-gradient-to-b from-transparent to-[#1BF5B0]/12
        border border-white/5
        flex flex-col gap-4
        my-5
        noise
      "
    >
      {/* Top Row */}
      <div className="flex items-center justify-between w-full">
        <p className="text-[#99A0AE] font-display text-sm sm:text-[15px]">
          Winnings
        </p>

        <div className="flex items-center gap-2">
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt={username}
              width={22}
              height={22}
              className="rounded-full w-5 h-5 sm:w-6 sm:h-6"
            />
          )}
          <span className="font-body text-base sm:text-lg text-white leading-none">
            {username}
          </span>
        </div>
      </div>

      {/* Winnings + Trophy */}
      <div className="flex items-center justify-between w-full">
        <p
          className="
            font-body
            text-[clamp(2.2rem,6vw,3rem)]
            leading-none
            text-[#14B985]
          "
        >
          ${winnings.toLocaleString()}
        </p>

        <Image
          src={trophy}
          alt="trophy"
          width={40}
          height={40}
          className="w-8 h-8 sm:w-10 sm:h-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Score */}
        <div
          className="
            flex flex-col gap-1
            bg-white/5 border border-white/10
            rounded-2xl p-3 sm:p-4
          "
        >
          <span className="text-[#99A0AE] text-sm font-body">Score</span>

          <div className="flex items-center gap-2">
            <FlashIcon className="w-5 h-5 text-[#FFC931]" />
            <span className="font-body text-[clamp(1rem,2vw,1.25rem)] text-white leading-none">
              {score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Rank */}
        <div
          className="
            flex flex-col gap-1
            bg-white/5 border border-white/10
            rounded-2xl p-3 sm:p-4
          "
        >
          <span className="text-[#99A0AE] text-sm font-body">Rank</span>

          <div className="flex items-center gap-2">
            <TrendIcon className="w-5 h-5 text-[#14B985]" />
            <span className="font-body text-[clamp(1rem,2vw,1.25rem)] text-white leading-none">
              {rank}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
