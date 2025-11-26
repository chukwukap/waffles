import React from "react";
import { cn } from "@/lib/utils";

// Status Icons
export const FailedIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
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

export const SuccessIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
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

const TWO_STEP_CLIP_PATH = `polygon(
  0 8px, 4px 8px, 4px 4px, 8px 4px, 8px 0,
  calc(100% - 8px) 0, calc(100% - 8px) 4px, calc(100% - 4px) 4px, calc(100% - 4px) 8px, 100% 8px,
  100% calc(100% - 8px), calc(100% - 4px) calc(100% - 8px), calc(100% - 4px) calc(100% - 4px), calc(100% - 8px) calc(100% - 4px), calc(100% - 8px) 100%,
  8px 100%, 8px calc(100% - 4px), 4px calc(100% - 4px), 4px calc(100% - 8px), 0 calc(100% - 8px)
)`;

interface StatusBadgeProps {
    variant: "success" | "error";
    children: React.ReactNode;
    className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
    return (
        <div
            style={{ clipPath: TWO_STEP_CLIP_PATH }}
            className={cn(
                "relative flex h-12 w-[272px] items-center justify-center gap-3",
                "font-body text-[20px] font-normal uppercase tracking-widest",
                "drop-shadow-[0_4px_35px_rgba(255,255,255,0.46)]",
                variant === "error" && "bg-[#B93814] text-white",
                variant === "success" && "bg-[#27AE60] text-white",
                className
            )}
        >
            {children}
        </div>
    );
}

interface StatusMessageProps {
    status: "idle" | "validating" | "success" | "failed";
    error: string | null;
    isPending: boolean;
}

export function StatusMessage({ status, error, isPending }: StatusMessageProps) {
    return (
        <div className="min-h-[60px] flex items-center justify-center transition-all duration-200">
            {(isPending || status === "validating") && (
                <p
                    className="text-xs text-[#a0a0a0] animate-pulse"
                    style={{
                        fontFamily: "'Press Start 2P', 'Geist Mono', monospace",
                        letterSpacing: "0.04em",
                    }}
                >
                    Validating...
                </p>
            )}

            {status === "failed" && error && (
                <StatusBadge variant="error">
                    <FailedIcon className="h-[18px] w-[18px]" />
                    <span>Invalid code</span>
                </StatusBadge>
            )}

            {status === "success" && (
                <StatusBadge variant="success">
                    <SuccessIcon className="h-[18px] w-[18px]" />
                    <span>Valid</span>
                </StatusBadge>
            )}
        </div>
    );
}
