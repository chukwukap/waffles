"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { CopyIcon, InviteFriendsIcon } from "@/components/icons";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { notify } from "@/components/ui/Toaster";

interface InviteFriendsDrawerProps {
  open: boolean;
  code: string;

  onClose: () => void;
}

export function InviteFriendsDrawer({
  open,
  code,
  onClose,
}: InviteFriendsDrawerProps) {
  const [mounted, setMounted] = React.useState(false);
  const drawerRef = React.useRef<HTMLDivElement | null>(null);

  const startY = React.useRef<number | null>(null);
  const [dragY, setDragY] = React.useState(0);
  const isDragging = startY.current !== null;

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) {
      document.documentElement.style.overflow = "";
      return;
    }
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onPointerDown = React.useCallback((e: React.PointerEvent) => {
    startY.current = e.clientY;
    setDragY(0);
    drawerRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = React.useCallback((e: React.PointerEvent) => {
    if (startY.current == null) return;
    const dy = Math.max(0, e.clientY - startY.current);
    setDragY(dy);
  }, []);

  const onPointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      if (startY.current == null) return;

      drawerRef.current?.releasePointerCapture(e.pointerId);

      const dy = dragY;
      startY.current = null;
      setDragY(0);
      if (dy > 140) onClose();
    },
    [dragY, onClose]
  );

  const copyCode = React.useCallback(async () => {
    if (!navigator.clipboard) {
      notify.error("Clipboard not available.");
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      notify.success("Code copied!");
    } catch (err) {
      console.error("Failed to copy code:", err);
      notify.error("Couldn't copy code.");
    }
  }, [code]);

  const shareInvite = React.useCallback(async () => {
    const text = `Join me on Waffles — use my invite code: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Waffle Invite", text });
      } catch (err) {
        if ((err as DOMException)?.name !== "AbortError") {
          console.error("Failed to share:", err);
          notify.error("Could not share invite.");
        }
      }
    } else {
      await copyCode();
    }
  }, [code, copyCode]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            aria-hidden
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.section
            key="drawer"
            ref={drawerRef}
            id="invite-friends-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Invite friends"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className={cn(
              "fixed inset-x-0 bottom-0 z-[81] isolate",
              "mx-auto w-full max-w-screen-sm",
              "rounded-t-[1.25rem] overflow-hidden",
              "border-t border-white/5",
              "bg-gradient-to-b from-[#1E1E1E] to-black",
              "shadow-[0_-20px_60px_rgba(0,0,0,.6)]",
              "transition-[transform,opacity] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
            )}
            style={
              isDragging
                ? {
                    transform: `translateY(${dragY}px)`,
                    opacity: Math.max(0.6, 1 - dragY / 800),
                    transition: "none",
                  }
                : undefined
            }
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative border-b border-white/5 bg-[#191919] px-4 pb-3 pt-6 cursor-grab active:cursor-grabbing"
              data-drag-handle
            >
              <div
                className="absolute left-1/2 top-3 h-1 w-9 -translate-x-1/2 rounded-full bg-white/40"
                aria-hidden
              />
              <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-2">
                <InviteFriendsIcon className="h-6 w-6 text-waffle-yellow" />{" "}
                <h2
                  className="font-edit-undo text-white leading-[1.15]"
                  style={{ fontSize: "clamp(1.05rem, 3.7vw, 1.25rem)" }}
                >
                  INVITE FRIENDS
                </h2>
              </div>
            </div>
            <div className="mx-auto flex w-full max-w-xs flex-col gap-3.5 px-4 py-4">
              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,201,49,.12)_100%)] flex flex-col items-center justify-center gap-3 px-3 py-12 sm:py-14">
                <Image
                  src="/images/icons/gift.svg"
                  alt=""
                  width={96}
                  height={96}
                  className="w-24 h-24 sm:w-28 sm:h-28"
                  priority
                />
                <div className="mt-1.5 flex w-full flex-col items-center">
                  <p
                    className="font-display text-muted tracking-[-0.03em]"
                    style={{
                      fontSize: "clamp(0.95rem, 3vw, 1rem)",
                      lineHeight: "130%",
                    }}
                  >
                    Your code is
                  </p>
                  <p
                    className="font-edit-undo text-white select-all"
                    style={{
                      fontSize: "clamp(1.9rem, 6vw, 2.375rem)",
                      lineHeight: "1.3",
                    }}
                  >
                    {code || "------"}
                  </p>
                </div>
              </div>
              <FancyBorderButton
                onClick={shareInvite}
                className="border-waffle-gold"
                disabled={!code || code === "------"}
              >
                SHARE INVITE
              </FancyBorderButton>
              <button
                onClick={copyCode}
                disabled={!code || code === "------"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 transition hover:bg-white/5 active:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CopyIcon />
                <span
                  className="font-edit-undo text-[#00CFF2] tracking-[-0.02em]"
                  style={{
                    fontSize: "clamp(1rem, 3.2vw, 1.125rem)",
                    lineHeight: "1.15",
                  }}
                >
                  COPY CODE
                </span>
              </button>
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
