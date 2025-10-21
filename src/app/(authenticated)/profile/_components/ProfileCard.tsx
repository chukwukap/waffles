"use client";

import Image from "next/image";
import { UploadIcon } from "@/components/icons";

type ProfileCardProps = {
  username: string;
  streak: number;
  /** same URL is used for avatar + blurred bg */
  avatarUrl: string;
  onUpload?: () => void;
};

export function ProfileCard({
  username,
  streak,
  avatarUrl,
  onUpload,
}: ProfileCardProps) {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-2xl border border-white/10",
        "px-3 py-3 sm:px-4 sm:py-3.5",
        // gold tint like the figma
        // "bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,201,49,0.12)_100%)]",
      ].join(" ")}
      aria-label={`${username} profile`}
    >
      {/* background: same as avatar, soft/blurred */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image
          src={avatarUrl}
          alt=""
          fill
          className="object-cover object-center opacity-70 blur-[18px] scale-125"
          priority
        />
        {/* subtle vignette so text pops */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/20" />
      </div>

      {/* row: upload • centered identity • spacer */}
      <div className="flex items-start justify-between gap-2">
        {/* upload button (left) */}
        <button
          onClick={onUpload}
          aria-label="Upload"
          className={[
            "grid size-9 place-items-center rounded-full bg-white/15",
            "transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white/30",
          ].join(" ")}
        >
          <UploadIcon className="h-[18px] w-[18px] text-white" />
        </button>

        {/* center block */}
        <div className="flex min-w-0 flex-col items-center gap-3">
          {/* avatar + name */}
          <div className="flex items-center gap-2">
            <Image
              src={avatarUrl}
              alt={`${username} avatar`}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full bg-[#FFF7B8] ring-2 ring-black/20"
              priority
            />
            <span
              className="font-body text-white tracking-tight"
              style={{ fontSize: "clamp(1.05rem,2.6vw,1.25rem)" }}
            >
              {username}
            </span>
          </div>

          {/* streak block */}
          <div className="flex flex-col items-center gap-1">
            <span
              className="font-display text-white/95"
              style={{
                fontSize: "clamp(.85rem,2vw,1rem)",
                letterSpacing: "-0.03em",
              }}
            >
              Streak
            </span>
            <div className="flex items-center gap-2">
              <Image
                src="/images/icons/streak-flame.svg"
                alt=""
                width={20}
                height={36}
                className="h-9 w-5 object-contain"
              />
              <span
                className="font-body text-foreground leading-none"
                style={{ fontSize: "clamp(1.75rem,4.6vw,2.25rem)" }}
              >
                {streak}
              </span>
            </div>
          </div>
        </div>

        {/* right spacer (keeps center truly centered) */}
        <div className="pointer-events-none size-9 opacity-0">
          <UploadIcon className="h-[18px] w-[18px]" />
        </div>
      </div>
    </section>
  );
}
