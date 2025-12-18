"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/miniapp-sdk";
import { cn } from "@/lib/utils";
import { notify } from "@/components/ui/Toaster";
import { playSound } from "@/lib/sounds";

interface LeaveGameDrawerProps {
  open: boolean;
  setIsLeaveGameDrawerOpen: Dispatch<SetStateAction<boolean>>;
  gameId: number;
}

export default function LeaveGameDrawer({
  open,
  setIsLeaveGameDrawerOpen,
  gameId,
}: LeaveGameDrawerProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const prevOpen = useRef(false);

  // Play warning sound when drawer opens
  useEffect(() => {
    if (open && !prevOpen.current) {
      playSound("exitWarning");
    }
    prevOpen.current = open;
  }, [open]);

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
        setIsLeaveGameDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setIsLeaveGameDrawerOpen]);

  const handleLeaveGame = useCallback(async () => {
    if (!gameId) {
      notify.error("Failed to leave game: No game ID found.");
      return;
    }

    setIsLeaving(true);
    try {
      const res = await sdk.quickAuth.fetch(`/api/v1/games/${gameId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to leave game");
      }

      notify.success("You've left the game");
      setIsLeaveGameDrawerOpen(false);
      router.push("/game");
    } catch (error) {
      console.error("Leave game failed:", error);
      notify.error(error instanceof Error ? error.message : "Failed to leave game");
    } finally {
      setIsLeaving(false);
    }
  }, [gameId, setIsLeaveGameDrawerOpen, router]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-game-title"
          className="fixed inset-0 z-100 font-display"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsLeaveGameDrawerOpen(false)}
            aria-hidden="true"
          />
          <motion.div
            className="absolute inset-x-0 bottom-0"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
          >
            <div
              className="w-full rounded-t-2xl overflow-hidden noise bg-linear-to-b from-[#1E1E1E] to-black"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full border-b border-white/5 bg-[#191919]">
                <div className="mx-auto w-full max-w-[480px] px-4 pt-3 pb-3 relative">
                  <div className="absolute left-1/2 top-2 -translate-x-1/2 h-[5px] w-9 rounded-[2.5px] bg-white/40" />
                  <div className="pt-5 text-center" />
                </div>
              </div>
              <div
                className="px-4"
                style={{
                  maxHeight: "min(75vh, 644px)",
                  overflowY: "auto",
                }}
              >
                <div className="mx-auto w-full max-w-lg pt-8 pb-6 text-center">
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
                    onClick={() => setIsLeaveGameDrawerOpen(false)}
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
                  <div className="mt-3">
                    <button
                      onClick={handleLeaveGame}
                      disabled={isLeaving}
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
                        {isLeaving ? "LEAVING..." : "YES, LEAVE"}
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
