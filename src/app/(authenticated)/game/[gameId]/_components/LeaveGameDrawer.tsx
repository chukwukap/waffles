"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LeaveGameDrawerProps {
  open: boolean;
  onClose: () => void;
  onConfirmLeave: () => void;
}

export default function LeaveGameDrawer({
  open,
  onClose,
  onConfirmLeave,
}: LeaveGameDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-game-title"
          className="fixed inset-0 z-[100] font-display"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="absolute inset-x-0 bottom-0"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
          >
            {/* Full width background container */}
            <div
              className="w-full rounded-t-2xl overflow-hidden noise bg-gradient-to-b from-[#1E1E1E] to-black"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Full width header background */}
              <div className="relative w-full border-b border-white/5 bg-[#191919]">
                {/* Slug indicator stays centered and max width contained */}
                <div className="mx-auto w-full max-w-[480px] px-4 pt-3 pb-3 relative">
                  <div className="absolute left-1/2 top-2 -translate-x-1/2 h-[5px] w-9 rounded-[2.5px] bg-white/40" />
                  <div className="pt-5 text-center">
                    {/* <p>Optional Timer or Title Here</p> */}
                  </div>
                </div>
              </div>
              {/* Content */}
              <div
                className="px-4"
                style={{
                  maxHeight: "min(75vh, 644px)",
                  overflowY: "auto",
                }}
              >
                <div className="mx-auto w-full max-w-[393px] pt-8 pb-6 text-center">
                  <div className="mb-3 inline-block">
                    <Image
                      src="/images/illustrations/leave-door.svg"
                      alt=""
                      width={84}
                      height={90}
                      priority
                    />
                  </div>
                  <h2
                    id="leave-game-title"
                    className="font-body text-white"
                    style={{
                      fontSize: "44px",
                      lineHeight: "0.92",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    RAGE QUIT?
                  </h2>
                  <div className="mt-2 mb-6">
                    <p className="font-display font-medium text-[16px] leading-[130%] tracking-[-0.03em] text-[#99A0AE]">
                      Leaving so soon?
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className={cn(
                      "group w-full rounded-xl bg-white px-4 py-[12px] border-0 relative text-center select-none",
                      "border-r-[5px] border-b-[5px] border-[#14B985]",
                      "transition active:translate-y-[2px] active:border-b-[3px]"
                    )}
                  >
                    <span
                      className="block font-body text-[#14B985]"
                      style={{
                        fontSize: "26px",
                        lineHeight: "1.15",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      STAY
                    </span>
                  </button>
                  {/* Secondary CTA (YES, LEAVE) */}
                  <div className="mt-3">
                    <button
                      onClick={onConfirmLeave}
                      className="w-full rounded-xl px-4 py-[12px] text-center transition hover:bg-white/5 active:bg-white/10"
                    >
                      <span
                        className="font-body text-[#00CFF2]"
                        style={{
                          fontSize: "18px",
                          lineHeight: "1.15",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        YES, LEAVE
                      </span>
                    </button>
                  </div>
                  <div className="h-4" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
