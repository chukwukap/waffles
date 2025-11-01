"use client";

import Image from "next/image";
import { UploadIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

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
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-2xl border border-white/10",
        "px-3 py-3 sm:px-4 sm:py-3.5"
      )}
      aria-label={`${username} profile summary`}
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image
          src={avatarUrl || "/images/avatars/a.png"}
          alt=""
          fill
          quality={50}
          className="object-cover object-center opacity-70 blur-lg scale-110"
          priority
          sizes="(max-width: 640px) 100vw, 640px"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/20 via-transparent to-black/30" />
      </div>
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onUpload}
          aria-label="Upload new avatar"
          disabled={!onUpload}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full bg-white/15",
            "transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white/30",
            !onUpload && "opacity-30 cursor-not-allowed pointer-events-none"
          )}
        >
          <UploadIcon className="h-[18px] w-[18px] text-white" />
        </button>
        <div className="flex min-w-0 flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Image
              src={avatarUrl || "/images/avatars/a.png"}
              alt={`${username}'s avatar`}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full bg-white/10 ring-2 ring-black/20 object-cover"
              priority
            />
            <span
              className="font-body text-white tracking-tight"
              style={{ fontSize: "clamp(1.05rem,2.6vw,1.25rem)" }}
            >
              {username || "Player"}
            </span>
          </div>
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
                className="font-body text-foreground leading-none tabular-nums"
                style={{ fontSize: "clamp(1.75rem,4.6vw,2.25rem)" }}
              >
                {streak ?? 0}
              </span>
            </div>
          </div>
        </div>
        <div
          className="pointer-events-none size-9 shrink-0 opacity-0"
          aria-hidden
        >
          <UploadIcon className="h-[18px] w-[18px]" />
        </div>
      </div>
    </section>
  );
}
