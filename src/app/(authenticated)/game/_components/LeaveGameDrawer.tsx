"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirmLeave: () => void;
};

export default function LeaveGameDrawer({
  open,
  onClose,
  onConfirmLeave,
}: Props) {
  // Prevent background scroll when sheet is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] font-display"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="absolute inset-x-0 bottom-0"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
          >
            <div
              className="mx-auto w-full max-w-[480px] rounded-t-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-[#191919] border-b border-white/5 px-4 pt-3 pb-3">
                <div className="absolute left-1/2 top-2 -translate-x-1/2 h-[5px] w-9 rounded-[2.5px] bg-white/40" />
                <div className="pt-5 text-center">
                  {/* optional timer/title slot if you need it */}
                </div>
              </div>

              {/* Body (scroll area) */}
              <div
                className="noise bg-gradient-to-b from-[#1E1E1E] to-black px-4"
                style={{
                  maxHeight: "min(75vh, 644px)",
                  overflowY: "auto",
                }}
              >
                <div className="mx-auto w-full max-w-[393px] pt-8 pb-6">
                  {/* Illustration */}
                  <div className="w-full flex items-center justify-center mb-3">
                    <Image
                      src="/images/leave-door.png" // <- drop your pixel door here
                      alt="Leave"
                      width={84}
                      height={90}
                      priority
                    />
                  </div>

                  {/* Title */}
                  <h2
                    className="text-center font-pixel text-white"
                    style={{
                      fontSize: "44px",
                      lineHeight: "0.92",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    RAGE QUIT?
                  </h2>

                  {/* Subtitle */}
                  <div className="mt-2 mb-6">
                    <p className="text-center font-brockmann font-medium text-[16px] leading-[130%] tracking-[-0.03em] text-[#99A0AE]">
                      Leaving so soon?
                    </p>
                  </div>

                  {/* Primary CTA (STAY) */}
                  <button
                    onClick={onClose}
                    className="group w-full rounded-xl bg-white px-4 py-[12px] border-0 relative text-center select-none"
                    style={{
                      borderRight: "5px solid var(--brand-green, #14B985)",
                      borderBottom: "5px solid var(--brand-green, #14B985)",
                    }}
                  >
                    <span
                      className="block font-pixel"
                      style={{
                        color: "var(--brand-green, #14B985)",
                        fontSize: "26px",
                        lineHeight: "1.15",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      STAY
                    </span>
                    {/* subtle shadow base for the 'retro drop' effect */}
                    <span
                      className="pointer-events-none absolute -z-10 inset-0 translate-y-[6px] translate-x-[6px] rounded-xl"
                      style={{ background: "transparent" }}
                    />
                  </button>

                  {/* Secondary CTA (YES, LEAVE) */}
                  <div className="mt-3">
                    <button
                      onClick={onConfirmLeave}
                      className="w-full rounded-xl px-4 py-[12px] text-center"
                    >
                      <span
                        className="font-pixel"
                        style={{
                          color: "var(--brand-cyan, #00CFF2)",
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
