"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { CopyIcon, InviteFriendsIcon } from "@/components/icons";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";

type Props = {
  open: boolean;
  code: string;
  onClose: () => void;
};

export function InviteFriendsDrawer({ open, code, onClose }: Props) {
  const [mounted, setMounted] = React.useState(false);
  const drawerRef = React.useRef<HTMLDivElement | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  // drag
  const startY = React.useRef<number | null>(null);
  const [dragY, setDragY] = React.useState(0);
  const isDragging = startY.current !== null;

  React.useEffect(() => setMounted(true), []);

  // Lock scroll while open
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

  // esc to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // drag handlers
  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    setDragY(0);
    drawerRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current == null) return;
    const dy = Math.max(0, e.clientY - startY.current);
    setDragY(dy);
  };
  const onPointerUp = () => {
    if (startY.current == null) return;
    const dy = dragY;
    startY.current = null;
    setDragY(0);
    if (dy > 140) onClose();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setToast("Code copied!");
    } catch {
      setToast("Couldn’t copy");
    } finally {
      setTimeout(() => setToast(null), 1400);
    }
  };

  const share = async () => {
    const text = `Join me on Waffle — use my invite code: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Waffle Invite", text });
        setToast("Invite shared!");
      } catch {
        /* dismissed */
      } finally {
        setTimeout(() => setToast(null), 1400);
      }
    } else {
      await copy();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className={[
          "fixed inset-0 z-[80] bg-black/60 transition-opacity",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />

      {/* Drawer */}
      <section
        id="invite-friends-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Invite friends"
        className={[
          "fixed inset-x-0 bottom-0 z-[81]",
          open ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
      >
        <div
          ref={drawerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className={[
            "relative isolate", // keeps z layering correct
            "mx-auto w-full max-w-screen-sm",
            "rounded-t-[1.25rem] overflow-hidden", // ensures radius applies visually
            "border-t border-white/5",
            "bg-gradient-to-b from-[#1E1E1E] to-black",
            "shadow-[0_-20px_60px_rgba(0,0,0,.6)]",
            "transform transition-[transform,opacity] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]",
            open && !isDragging
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0",
          ].join(" ")}
          style={
            isDragging
              ? {
                  transform: `translateY(${dragY}px)`,
                  opacity: Math.max(0.6, 1 - dragY / 800),
                }
              : undefined
          }
        >
          {/* Handle + Title */}
          <div
            className="
            relative border-b border-white/5 bg-[#191919]
            px-4 pb-3
            pt-6

          "
          >
            <div
              className="absolute left-1/2 top-3 h-1 w-9 -translate-x-1/2 rounded-full bg-white/40"
              aria-hidden
            />
            <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-2">
              <InviteFriendsIcon className="h-6 w-6 text-waffle-yellow" />
              <h2
                className="font-edit-undo text-white leading-[1.15]"
                style={{ fontSize: "clamp(1.05rem, 3.7vw, 1.25rem)" }}
              >
                INVITE FRIENDS
              </h2>
            </div>
          </div>

          {/* Body */}
          <div className="mx-auto flex w-full max-w-xs flex-col gap-3.5 px-4 py-4">
            {/* Gift + code card */}
            <div
              className="
              rounded-2xl border border-white/10
              bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,201,49,.12)_100%)]
              flex flex-col items-center justify-center gap-3
              px-3 py-12 sm:py-14
            "
            >
              <Image
                src="/images/icons/gift.svg"
                alt="Gift"
                width={96}
                height={96}
                className="w-24 h-24 sm:w-28 sm:h-28"
                priority
              />
              <div className="mt-1.5 flex w-full flex-col items-center">
                <p
                  className="font-brockmann text-waffle-gray tracking-[-0.03em]"
                  style={{
                    fontSize: "clamp(0.95rem, 3vw, 1rem)",
                    lineHeight: "130%",
                  }}
                >
                  Your code is
                </p>
                <p
                  className="font-edit-undo text-white"
                  style={{
                    fontSize: "clamp(1.9rem, 6vw, 2.375rem)",
                    lineHeight: "1.3",
                  }}
                >
                  {code}
                </p>
              </div>
            </div>

            {/* Share button (white tile with yellow “pixel” shadow) */}
            <FancyBorderButton onClick={share} className="border-waffle-gold">
              SHARE INVITE
            </FancyBorderButton>

            {/* Copy row */}
            <button
              onClick={copy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5"
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
        </div>
      </section>

      {/* Toast */}
      <div
        aria-live="polite"
        className={[
          "fixed inset-x-0 z-[82] flex justify-center transition-opacity duration-200",
          "bottom-[calc(env(safe-area-inset-bottom,0px)+88px)]",
          toast ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <div className="rounded-full bg-white/10 px-3 py-2 text-sm text-white backdrop-blur">
          {toast}
        </div>
      </div>
    </>,
    document.body
  );
}
