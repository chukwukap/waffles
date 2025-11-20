"use client";
import { ArrowLeftIcon } from "@/components/icons";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SubHeaderProps {
  title: React.ReactNode;
  onBack?: () => void;
  className?: string;
  backButtonClassName?: string;
}

export function SubHeader({ title, onBack, className, backButtonClassName }: SubHeaderProps) {
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const href = fid ? `/profile?fid=${fid}` : "/profile";

  return (
    <div className={cn("mx-auto flex w-full max-w-lg items-center justify-between px-4 pt-4", className)}>
      {onBack ? (
        <button
          onClick={onBack}
          className={cn(
            "flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/15 transition-opacity hover:opacity-80",
            backButtonClassName
          )}
          aria-label="Back"
        >
          <ArrowLeftIcon />
        </button>
      ) : (
        <Link
          href={href}
          className={cn(
            "flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/15 transition-opacity hover:opacity-80",
            backButtonClassName
          )}
          aria-label="Back to profile"
        >
          <ArrowLeftIcon />
        </Link>
      )}

      <div className="grow text-center text-white font-body flex justify-center">
        {typeof title === "string" ? (
          <h1
            style={{
              fontWeight: 400,
              fontSize: "clamp(1.25rem, 4.5vw, 1.375rem)",
              lineHeight: ".92",
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </h1>
        ) : (
          title
        )}
      </div>
      <div className="h-[34px] w-[34px]" aria-hidden="true" />
    </div>
  );
}
