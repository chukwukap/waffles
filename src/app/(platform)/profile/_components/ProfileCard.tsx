"use client";

import Image from "next/image";
import { UploadIcon } from "@/components/icons";

interface ProfileCardProps {
  username: string;
  streak: number;
  avatarUrl: string;
  onUpload?: () => void;
}

export function ProfileCard({
  username,
  streak,
  avatarUrl,
  onUpload,
}: ProfileCardProps) {
  return (
    <div
      className="relative overflow-hidden group select-none"
      style={{
        width: "361px",
        height: "152px",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.08)", // #FFFFFF14
        background:
          "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 201, 49, 0.12) 100%)",
        padding: "12px",
      }}
    >
      {/* Upload Icon (Top Left) */}
      <div
        onClick={onUpload}
        className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-[2px] border border-white/5 cursor-pointer hover:bg-white/20 transition-colors active:scale-95"
        role="button"
        aria-label="Upload"
      >
        <UploadIcon className="text-white h-4 w-4" />
      </div>

      {/* Background PFP Effect - Ghost Image */}
      <div className="absolute right-[-20px] top-[-20px] w-[200px] h-[200px] z-0 opacity-[0.07] pointer-events-none grayscale contrast-150">
        <Image
          src={avatarUrl}
          alt={`${username} avatar`}
          className="w-full h-full object-cover rounded-full blur-xs"
          fill
          sizes="200px"
        />
      </div>

      {/* Inner Content Container */}
      <div
        className="relative z-10 flex flex-col justify-between h-full"
        style={{
          width: "100%",
          height: "128px",
          paddingTop: "4px",
          paddingBottom: "4px",
        }}
      >
        {/* Top Row: Avatar & Username */}
        <div className="flex items-center justify-center gap-3 w-full">
          {/* Avatar Circle */}
          <div className="relative w-10 h-10 rounded-full bg-[#4AD2FF] overflow-hidden border border-white/10 shadow-sm shrink-0">
            <Image
              src={avatarUrl}
              alt={`${username} avatar`}
              className="w-full h-full object-cover"
              fill
              sizes="40px"
            />
          </div>

          {/* Username */}
          <span
            className="font-body text-white uppercase tracking-widest"
            style={{
              fontSize: "18px",
              lineHeight: "130%",
              fontWeight: 400,
              opacity: 0.9,
            }}
          >
            {username}
          </span>
        </div>

        {/* Bottom Section: Streak Label + Count */}
        <div className="flex flex-col items-center justify-end pb-1">
          {/* Label: Streak */}
          <span
            className="font-display text-white/80 mb-1"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: "130%",
              letterSpacing: "-0.03em",
            }}
          >
            Streak
          </span>

          {/* Row: Fire Icon + Number */}
          <div className="flex items-center gap-2">
            {/* Fire Icon */}
            <div
              className="flex items-center justify-center"
              style={{ width: "20px", height: "36px" }}
            >
              <Image
                src="/images/icons/streak-flame.svg"
                width={28}
                height={28}
                fetchPriority="high"
                alt="Streak Flame"
                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,165,0,0.5)]"
              />
            </div>

            {/* Number */}
            <span
              className="font-body text-white"
              style={{
                fontSize: "34px",
                lineHeight: "90%",
                fontWeight: 400,
              }}
            >
              {streak}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
