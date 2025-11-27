// import Image from "next/image";
// import { FlashIcon, TrendIcon } from "@/components/icons";
// import { ReactNode } from "react";

// interface Props {
//   winnings: number;
//   score: number;
//   rank: number;
//   username: string;
//   pfpUrl: string; // CHANGED: from avatarUrl
// }

// interface StatCardProps {
//   label: string;
//   value: number | string;
//   icon: ReactNode;
//   iconColor: string;
// }

// function getTrophy(rank: number) {
//   if (rank === 1) return "/images/trophies/gold.svg";
//   if (rank === 2) return "/images/trophies/silver.svg";
//   if (rank === 3) return "/images/trophies/bronze.svg";
//   return "/images/trophies/participant.svg";
// }

// function StatCard({ label, value, icon, iconColor }: StatCardProps) {
//   const displayValue =
//     typeof value === "number" ? value.toLocaleString() : value;

//   return (
//     <div
//       className="
//         flex flex-col gap-1
//         bg-white/5 border border-white/10
//         rounded-2xl p-3 sm:p-4
//       "
//     >
//       <span className="text-[#99A0AE] text-[14px] font-display text-left">
//         {label}
//       </span>

//       <div className="flex items-center gap-2">
//         <span className={iconColor}>{icon}</span>
//         <span className="font-body text-[20px] text-white leading-none">
//           {displayValue}
//         </span>
//       </div>
//     </div>
//   );
// }

// export default function WinningsCard({
//   winnings,
//   score,
//   rank,
//   username,
//   pfpUrl, // CHANGED: from avatarUrl
// }: Props) {
//   const trophy = getTrophy(rank);

//   return (
//     <div
//       className={`
//         w-[361px] h-[202px]
//         rounded-3xl
//         p-[12px]
//         bg-linear-to-b from-transparent to-[#1BF5B0]/12
//         border border-white/5
//         flex flex-col gap-4
//         my-5
//         font-display
//         font-medium 
//         text-[16px]
//         leading-[130%]
//         tracking-[-0.03em]
//         text-center
//       `}
//       style={{
//         fontWeight: 500,
//         fontStyle: "normal",
//         letterSpacing: "-0.03em",
//       }}
//     >
//       {/* Top Row */}
//       <div className="flex items-center justify-between w-full">
//         <p className="text-[#99A0AE] font-display text-[14px]">Winnings</p>

//         <div className="flex items-center gap-2">
//           {pfpUrl && ( // CHANGED: from avatarUrl
//             <Image
//               src={pfpUrl} // CHANGED: from avatarUrl
//               alt={username}
//               width={20}
//               height={20}
//               className="rounded-full"
//             />
//           )}
//           <span className="font-body text-[18px] text-white leading-none">
//             {username}
//           </span>
//         </div>
//       </div>

//       {/* Winnings + Trophy */}
//       <div className="flex items-center justify-between w-full">
//         <p
//           className="
//             font-body
//             text-[48px]
//             leading-none
//             text-[#14B985]
//           "
//         >
//           ${winnings.toLocaleString()}
//         </p>

//         <Image src={trophy} alt="trophy" width={39} height={48} />
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-2 gap-3 w-full">
//         <StatCard
//           label="Score"
//           value={score}
//           icon={<FlashIcon className="w-[24px] h-[24px]" />}
//           iconColor="text-[#FFC931]"
//         />
//         <StatCard
//           label="Rank"
//           value={rank}
//           icon={<TrendIcon className="w-[24px] h-[24px]" />}
//           iconColor="text-[#14B985]"
//         />
//       </div>
//     </div>
//   );
// }

import Image from "next/image";
import { FlashIcon, TrendIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface Props {
  winnings: number;
  score: number;
  rank: number;
  username: string;
  pfpUrl: string;
  // We make these optional to reuse the card in other contexts if needed
  className?: string;
}

export default function WinningsCard({
  winnings,
  score,
  rank,
  username,
  pfpUrl,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "relative flex flex-col w-full max-w-lg h-auto",
        "rounded-[32px] border border-white/20",
        "bg-[#D8FFF1]/10", // Subtle green tint matching the mock
        "p-6 gap-6",
        "backdrop-blur-sm",
        className
      )}
    >
      {/* ─── Top Row: Label & User Profile ─── */}
      <div className="flex items-start justify-between w-full">
        <span className="font-display font-medium text-[16px] text-[#99A0AE] tracking-[-0.02em]">
          Winnings
        </span>

        <div className="flex items-center gap-2 bg-black/20 pr-3 pl-1 py-1 rounded-full">
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20">
            <img
              src={pfpUrl || "/images/avatars/a.png"}
              alt={username}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="font-body text-[14px] text-white uppercase tracking-wide leading-none pt-0.5">
            {username}
          </span>
        </div>
      </div>

      {/* ─── Middle Row: Big Money & Trophy ─── */}
      <div className="flex items-center justify-between w-full -mt-1">
        <h2
          className="font-body text-[56px] leading-[0.9] tracking-[-0.03em] text-[#14B985] drop-shadow-sm"
        >
          ${winnings.toLocaleString()}
        </h2>

        <div className="relative w-[58px] h-[64px] shrink-0 animate-up delay-100">
          {/* Using the gold trophy from your assets */}
          <Image
            src="/images/trophies/gold.svg"
            alt="Winner Trophy"
            fill
            className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          />
        </div>
      </div>

      {/* ─── Bottom Row: Stats Grid ─── */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {/* Score Box */}
        <div className="flex flex-col gap-1 bg-white/5 rounded-2xl p-4 border border-white/5">
          <span className="font-display text-[14px] text-[#99A0AE]">Score</span>
          <div className="flex items-center gap-2">
            <FlashIcon className="w-5 h-5 text-[#FFC931]" />
            <span className="font-body text-[24px] text-white leading-none pt-1">
              {score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Rank Box */}
        <div className="flex flex-col gap-1 bg-white/5 rounded-2xl p-4 border border-white/5">
          <span className="font-display text-[14px] text-[#99A0AE]">Rank</span>
          <div className="flex items-center gap-2">
            <TrendIcon className="w-5 h-5 text-[#14B985]" />
            <span className="font-body text-[24px] text-white leading-none pt-1">
              {rank}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}