"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Status Icons
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
    <motion.div
      style={{ clipPath: TWO_STEP_CLIP_PATH }}
      className={cn(
        "relative flex h-12 w-[272px] items-center justify-center gap-3",
        "font-body text-[20px] font-normal uppercase tracking-widest",
        "drop-shadow-[0_4px_35px_rgba(255,255,255,0.46)]",
        variant === "error" && "bg-[#B93814] text-white",
        variant === "success" && "bg-[#27AE60] text-white",
        className
      )}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}

interface StatusMessageProps {
  status: "idle" | "validating" | "success" | "failed";
  error: string | null;
  isPending: boolean;
}

export function StatusMessage({ status, error, isPending }: StatusMessageProps) {
  return (
    <div className="min-h-[60px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        {(isPending || status === "validating") && (
          <motion.p
            key="validating"
            className="text-xs text-[#a0a0a0] flex items-center gap-2"
            style={{
              fontFamily: "'Press Start 2P', 'Geist Mono', monospace",
              letterSpacing: "0.04em",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <motion.span
              className="inline-block w-3 h-3 border-2 border-white/30 border-t-cyan-400 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            Validating...
          </motion.p>
        )}

        {status === "failed" && error && (
          <StatusBadge key="failed" variant="error">
            <FailedIcon className="h-[18px] w-[18px]" />
            <span>Invalid code</span>
          </StatusBadge>
        )}

        {status === "success" && (
          <StatusBadge key="success" variant="success">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <SuccessIcon className="h-[18px] w-[18px]" />
            </motion.div>
            <span>Valid</span>
          </StatusBadge>
        )}
      </AnimatePresence>
    </div>
  );
}
