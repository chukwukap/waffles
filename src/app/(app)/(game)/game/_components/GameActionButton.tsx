"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface GameActionButtonProps {
  children: React.ReactNode;
  href?: string;
  disabled?: boolean;
  variant?: "default" | "wide";
  textColor?: "dark" | "neon-pink";
  backgroundColor?: string;
}

/**
 * Reusable game action button component
 */
export function GameActionButton({
  children,
  href,
  disabled = false,
  variant = "default",
  textColor = "neon-pink",
  backgroundColor,
}: GameActionButtonProps) {
  const buttonClasses = cn(
    "flex h-10 items-center justify-center rounded-full border-2 border-(--color-neon-pink) tabular-nums",
    variant === "wide" ? "min-w-[90px] px-4" : "min-w-[72px] px-4",
    disabled && "bg-gray-800/60 cursor-not-allowed opacity-60"
  );

  const textClasses = cn(
    "font-body text-[16px] leading-[115%] text-center whitespace-nowrap",
    textColor === "dark" ? "text-[#171523]" : "text-(--color-neon-pink) font-bold"
  );

  const linkHref = disabled || !href ? "#" : href;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled || !href) {
      e.preventDefault();
    }
  };

  return (
    <Link
      href={linkHref}
      prefetch={false}
      className={buttonClasses}
      style={backgroundColor ? { background: backgroundColor } : undefined}
      onClick={handleClick}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
    >
      <span className={textClasses}>{children}</span>
    </Link>
  );
}
