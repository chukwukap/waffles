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
      className="relative overflow-hidden group select-none w-full max-w-lg h-full"
      style={{
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        background:
          "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 201, 49, 0.12) 100%)",
        padding: "clamp(8px, 2vw, 12px)",
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
        <img
          src={avatarUrl}
          alt={`${username} avatar`}
          className="w-full h-full object-cover rounded-full blur-xs"
        />
      </div>

      {/* Inner Content Container */}
      <div
        className="relative z-10 flex flex-col justify-between h-full"
        style={{
          width: "100%",
          paddingTop: "4px",
          paddingBottom: "4px",
        }}
      >
        {/* Top Row: Avatar & Username */}
        <div className="flex items-center justify-center gap-2 w-full">
          {/* Avatar Circle */}
          <div
            className="relative rounded-full bg-[#4AD2FF] overflow-hidden border border-white/10 shadow-sm shrink-0"
            style={{ width: "clamp(32px, 8vw, 40px)", height: "clamp(32px, 8vw, 40px)" }}
          >
            <img
              src={avatarUrl}
              alt={`${username} avatar`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Username */}
          <span
            className="font-body text-white uppercase tracking-widest"
            style={{
              fontSize: "clamp(14px, 4vw, 18px)",
              lineHeight: "130%",
              fontWeight: 400,
              opacity: 0.9,
            }}
          >
            {username}
          </span>
        </div>

        {/* Bottom Section: Streak Label + Count */}
        <div className="flex flex-col items-center justify-end">
          {/* Label: Streak */}
          <span
            className="font-display text-white/80"
            style={{
              fontSize: "clamp(12px, 2.5vw, 14px)",
              fontWeight: 500,
              lineHeight: "130%",
              letterSpacing: "-0.03em",
              marginBottom: "clamp(2px, 0.5vh, 4px)",
            }}
          >
            Streak
          </span>

          {/* Row: Fire Icon + Number */}
          <div className="flex items-center gap-1">
            {/* Fire Icon */}
            <div
              className="flex items-center justify-center"
              style={{ width: "clamp(16px, 4vw, 20px)", height: "clamp(28px, 6vh, 36px)" }}
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
                fontSize: "clamp(24px, 6vw, 34px)",
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
