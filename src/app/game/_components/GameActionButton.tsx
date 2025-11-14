import Link from "next/link";
import { cn } from "@/lib/utils";

interface GameActionButtonProps {
  /**
   * The text to display in the button
   */
  children: React.ReactNode;
  /**
   * Optional href for link buttons
   */
  href?: string;
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  /**
   * Button variant - affects width and styling
   */
  variant?: "default" | "wide";
  /**
   * Text color variant
   */
  textColor?: "dark" | "neon-pink";
  /**
   * Background color - if provided, button will have filled background
   */
  backgroundColor?: string;
}

/**
 * Reusable game action button component
 * Handles all button states: disabled, active links, countdown, etc.
 * Uses Link component for all cases, with disabled handling for non-link states
 */
export function GameActionButton({
  children,
  href,
  disabled = false,
  variant = "default",
  textColor = "neon-pink",
  backgroundColor,
}: GameActionButtonProps) {
  // Base button classes
  const baseClasses =
    "order-1 box-border z-0 flex h-10 flex-none flex-row items-center justify-center rounded-full border-2 border-(--color-neon-pink) tabular-nums";

  // Width classes based on variant
  const widthClasses =
    variant === "wide"
      ? "min-w-[80px] w-[clamp(90px,22vw,130px)] max-w-[150px] px-3 sm:px-4"
      : "min-w-[64px] w-[clamp(72px,20vw,110px)] max-w-[140px] px-4 sm:px-5";

  // Padding classes
  const paddingClasses = "py-1 sm:py-2";

  // Disabled state classes
  const disabledClasses = disabled
    ? "bg-gray-800/60 cursor-not-allowed opacity-60"
    : "";

  // Text color classes
  const textColorClasses =
    textColor === "dark"
      ? "text-[#171523]"
      : "text-(--color-neon-pink) font-bold";

  // Combined button classes
  const buttonClasses = cn(
    baseClasses,
    widthClasses,
    paddingClasses,
    disabledClasses
  );

  // Text span classes - remove text-xs, add arcadeclassic font, 16px font, 114.999...% line-height, center, bottom align
  const textClasses = cn(
    "flex items-end justify-center w-full min-w-0 select-none not-italic text-center whitespace-nowrap font-body",
    "font-normal", // 400 weight
    "text-[16px]",
    "leading-[115%]", // 115% line-height
    textColorClasses
  );

  // Inline styles for background color
  const buttonStyle = backgroundColor
    ? {
        background: backgroundColor,
        textDecoration: "none",
        transition: "background 0.2s",
      }
    : {};

  // Text inline styles to match: fontWeight 400, fontStyle normal, fontFamily ArcadeClassic, fontSize 16px, lineHeight ~115%, letterSpacing 0, center
  const textStyle = {
    fontWeight: 400,
    fontStyle: "normal",
    fontSize: "16px",
    lineHeight: "115%",
    textAlign: "center" as const,
    verticalAlign: "bottom" as const,
    letterSpacing: "0",
  };

  // Use Link for all cases - when disabled or no href, use "#" and prevent navigation
  const linkHref = disabled || !href ? "#" : href;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled || !href) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Link
      href={linkHref}
      prefetch={false}
      className={buttonClasses}
      style={buttonStyle}
      onClick={handleClick}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
    >
      <span className={textClasses} style={textStyle}>
        {children}
      </span>
    </Link>
  );
}
