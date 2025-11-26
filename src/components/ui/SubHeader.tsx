"use client";
import { ArrowLeftIcon } from "@/components/icons";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SubHeaderProps {
  title: React.ReactNode;
  className?: string;
  backButtonClassName?: string;
}

export function SubHeader({ title, className, backButtonClassName }: SubHeaderProps) {
  const router = useRouter();

  return (
    <div className={cn("mx-auto flex w-full max-w-lg items-center justify-between px-4 pt-4", className)}>
      <button
        onClick={() => router.back()}
        className={cn(
          "flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/15 transition-opacity hover:opacity-80",
          backButtonClassName
        )}
        aria-label="Back"
      >
        <ArrowLeftIcon />
      </button>

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
