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
    <div className="w-full max-w-[380px] rounded-3xl p-5 mt-6 bg-gradient-to-b from-black/80 to-[#1BF5B020] border border-[#34FF8B10] shadow-[0_0_0_2px_#00F97B10_inset] relative">
      {/* Header Section */}
      <div className="flex items-center justify-between w-full mb-1">
        <div className="flex flex-row gap-2 items-center">
          <p className="text-[#99A0AE] text-sm font-sans">Winnings</p>

          <div className="flex items-center gap-2 ml-2">
            {avatarUrl && (
              <Image
                src={avatarUrl}
                alt={username ?? ""}
                width={26}
                height={26}
                className="rounded-full border border-[#222] shadow-lg"
              />
            )}
            {username && (
              <span className="font-pixel text-base tracking-widest text-white drop-shadow-[0_1px_0_#000] uppercase">
                {username}
              </span>
            )}
          </div>
        </div>
        <Image src={trophy} width={40} height={40} alt="trophy" />
      </div>
      {/* Main Winnings */}
      <p className="font-pixel text-[44px] mt-1 text-[#34FF8B] drop-shadow-[0_2px_0_#0a5637] tracking-wide">
        ${winnings.toLocaleString()}
      </p>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {/* Score */}
        <div className="bg-[#1F2327] border border-[#232b34] rounded-2xl px-4 py-3 flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-[#99A0AE] text-sm flex items-center gap-1 font-sans">
              <FlashIcon className="w-5 h-5 text-[#F2CB68]" />
              <span>Score</span>
            </span>
          </div>
          <span className="font-pixel text-[20px] mt-1 tracking-wider text-white">
            {score.toLocaleString()}
          </span>
        </div>
        {/* Rank */}
        <div className="bg-[#1F2327] border border-[#232b34] rounded-2xl px-4 py-3 flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-[#99A0AE] text-sm flex items-center gap-1 font-sans">
              <TrendIcon className="w-5 h-5 text-[#00CFF2]" />
              <span>Rank</span>
            </span>
          </div>
          <span className="font-pixel text-[20px] mt-1 tracking-wider text-white">
            {rank}
          </span>
        </div>
      </div>
      {/* Card Border Effect */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl border border-[#25ffad27]"></div>
    </div>
  );
}
