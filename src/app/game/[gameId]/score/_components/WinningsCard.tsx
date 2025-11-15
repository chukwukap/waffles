import Image from "next/image";
import { FlashIcon, TrendIcon } from "@/components/icons";
import { ReactNode } from "react";

interface Props {
  winnings: number;
  score: number;
  rank: number;
  username: string;
  avatarUrl: string;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  iconColor: string;
}

function getTrophy(rank: number) {
  if (rank === 1) return "/images/trophies/gold.svg";
  if (rank === 2) return "/images/trophies/silver.svg";
  if (rank === 3) return "/images/trophies/bronze.svg";
  return "/images/trophies/participant.svg";
}

function StatCard({ label, value, icon, iconColor }: StatCardProps) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div
      className="
        flex flex-col gap-1
        bg-white/5 border border-white/10
        rounded-2xl p-3 sm:p-4
      "
    >
      <span className="text-[#99A0AE] text-[14px] font-display text-left">
        {label}
      </span>

      <div className="flex items-center gap-2">
        <span className={iconColor}>{icon}</span>
        <span className="font-body text-[20px] text-white leading-none">
          {displayValue}
        </span>
      </div>
    </div>
  );
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
      className={`
        w-[361px] h-[202px]
        rounded-3xl
        p-[12px]
        bg-linear-to-b from-transparent to-[#1BF5B0]/12
        border border-white/5
        flex flex-col gap-4
        my-5
        font-display
        font-medium 
        text-[16px]
        leading-[130%]
        tracking-[-0.03em]
        text-center
      `}
      style={{
        fontWeight: 500,
        fontStyle: "normal",
        letterSpacing: "-0.03em",
      }}
    >
      {/* Top Row */}
      <div className="flex items-center justify-between w-full">
        <p className="text-[#99A0AE] font-display text-[14px]">Winnings</p>

        <div className="flex items-center gap-2">
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt={username}
              width={20}
              height={20}
              className="rounded-full"
            />
          )}
          <span className="font-body text-[18px] text-white leading-none">
            {username}
          </span>
        </div>
      </div>

      {/* Winnings + Trophy */}
      <div className="flex items-center justify-between w-full">
        <p
          className="
            font-body
            text-[48px]
            leading-none
            text-[#14B985]
          "
        >
          ${winnings.toLocaleString()}
        </p>

        <Image src={trophy} alt="trophy" width={39} height={48} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <StatCard
          label="Score"
          value={score}
          icon={<FlashIcon className="w-[24px] h-[24px]" />}
          iconColor="text-[#FFC931]"
        />
        <StatCard
          label="Rank"
          value={rank}
          icon={<TrendIcon className="w-[24px] h-[24px]" />}
          iconColor="text-[#14B985]"
        />
      </div>
    </div>
  );
}
