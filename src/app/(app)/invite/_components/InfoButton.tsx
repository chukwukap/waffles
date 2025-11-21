import React from "react";
import { cn } from "@/lib/utils";

// --- ASSETS ---

export const FailedIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M2 0H0V18H18V0H2ZM16 2V16H2V2H16ZM8 6H6V4H4V6H6V8H8V10H6V12H4V14H6V12H8V10H10V12H12V14H14V12H12V10H10V8H12V6H14V4H12V6H10V8H8V6Z"
      fill="currentColor"
    />
  </svg>
);

export const SuccessIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="22"
    height="12"
    viewBox="0 0 22 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M14 0H16V2H14V0ZM12 4V2H14V4H12ZM10 6V4H12V6H10ZM8 8V6H10V8H8ZM6 10V8H8V10H6ZM4 10H6V12H4V10ZM2 8H4V10H2V8ZM2 8H0V6H2V8ZM10 10H12V12H10V10ZM14 8V10H12V8H14ZM16 6V8H14V6H16ZM18 4V6H16V4H18ZM20 2H18V4H20V2ZM20 2H22V0H20V2Z"
      fill="currentColor"
    />
  </svg>
);

// --- CONSTANTS ---

const TWO_STEP_CLIP_PATH = `polygon(
  0 8px, 4px 8px, 4px 4px, 8px 4px, 8px 0,
  calc(100% - 8px) 0, calc(100% - 8px) 4px, calc(100% - 4px) 4px, calc(100% - 4px) 8px, 100% 8px,
  100% calc(100% - 8px), calc(100% - 4px) calc(100% - 8px), calc(100% - 4px) calc(100% - 4px), calc(100% - 8px) calc(100% - 4px), calc(100% - 8px) 100%,
  8px 100%, 8px calc(100% - 4px), 4px calc(100% - 4px), 4px calc(100% - 8px), 0 calc(100% - 8px)
)`;

// --- COMPONENT ---

export interface InfoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  onClick: () => void;
  type: "button" | "submit" | "reset";
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const InfoButton = React.forwardRef<HTMLButtonElement, InfoButtonProps>(
  ({ className, children, style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        style={{
          clipPath: TWO_STEP_CLIP_PATH,
          ...style,
        }}
        className={cn(
          // Layout
          "relative flex h-12 w-[272px] items-center justify-center gap-3",

          // Default Styles (Failure State Red) - can be overridden by className
          "bg-[#B93814] text-white",

          // Typography
          "font-body text-[20px] font-normal uppercase tracking-widest",

          // Effects
          "drop-shadow-[0_4px_35px_rgba(255,255,255,0.46)]",
          "transition-transform hover:scale-105 active:scale-95 active:translate-y-1",

          // Allow user overrides
          className
        )}
      >
        {children}
      </button>
    );
  }
);
InfoButton.displayName = "InfoButton";

export { InfoButton };
