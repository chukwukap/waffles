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
      className="relative box-border flex flex-col items-center p-3 gap-3 w-full max-w-[361px] h-[152px] mx-auto overflow-hidden"
      style={{
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        background:
          "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 201, 49, 0.12) 100%)",
      }}
    >
      {/* Background PFP Effect - Ghost Image (Centered) */}
      <div className="absolute inset-0 flex items-center justify-center z-0 opacity-[0.07] pointer-events-none grayscale contrast-150">
        <Image
          width={200}
          height={200}
          src={avatarUrl}
          alt=""
          className="w-[200px] h-[200px] object-cover rounded-full blur-xs"
        />
      </div>

      {/* User + Time Row */}
      <div className="relative z-10 flex flex-row justify-between items-start py-1 gap-1.5 w-full flex-1">
        {/* User Section */}
        <div className="flex flex-row justify-between items-start gap-2 w-full flex-1">
          {/* Upload Button (Left) */}
          <div
            onClick={onUpload}
            className="box-border flex flex-row justify-center items-center p-2 gap-2 w-[34px] h-[34px] bg-white/13 rounded-[900px] cursor-pointer hover:bg-white/20 transition-colors active:scale-95"
            role="button"
            aria-label="Upload"
          >
            <UploadIcon className="text-white w-[18px] h-[18px]" />
          </div>

          {/* Center Content: Avatar, Username, Streak */}
          <div className="flex flex-col justify-center items-center gap-[13px] h-[120px]">
            {/* Avatar + Username Row */}
            <div className="flex flex-row justify-center items-center gap-2">
              {/* Avatar Circle */}
              <div
                className="w-9 h-9 rounded-full overflow-hidden shrink-0"
                style={{ background: "#FFF7B8" }}
              >
                <Image
                  width={36}
                  height={36}
                  src={avatarUrl}
                  alt={`${username} avatar`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Username */}
              <span
                className="font-body text-white uppercase"
                style={{
                  fontSize: "18px",
                  lineHeight: "130%",
                  fontWeight: 400,
                }}
              >
                {username}
              </span>
            </div>

            {/* Streak Section */}
            <div className="flex flex-col justify-center items-center flex-1">
              {/* Streak Label */}
              <span
                className="font-display text-white text-center"
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  lineHeight: "130%",
                  letterSpacing: "-0.03em",
                }}
              >
                Streak
              </span>

              {/* Streak Value Row */}
              <div className="flex flex-col justify-center items-center gap-1">
                <div className="flex flex-row justify-center items-center gap-2.5">
                  {/* Fire Icon */}
                  <div className="w-5 h-9 flex items-center justify-center">
                    <Image
                      src="/images/icons/streak-flame.svg"
                      width={20}
                      height={36}
                      fetchPriority="high"
                      alt="Streak Flame"
                      className="object-contain"
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

          {/* Invisible placeholder (Right) for symmetry */}
          <div
            className="box-border flex flex-row justify-center items-center p-2 gap-2 w-[34px] h-[34px] bg-white/13 opacity-0 rounded-[900px]"
            aria-hidden="true"
          >
            <UploadIcon className="text-white w-[18px] h-[18px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
