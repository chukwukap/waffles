"use client"; // Required for hooks, portal, browser APIs, framer-motion

import * as React from "react";
import { createPortal } from "react-dom"; //
import Image from "next/image"; //
import { CopyIcon, InviteFriendsIcon } from "@/components/icons"; //
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton"; //
import { motion, AnimatePresence } from "framer-motion"; // Import motion & AnimatePresence
import { cn } from "@/lib/utils"; // Import cn utility
import { notify } from "@/components/ui/Toaster"; // Import notify for consistent feedback

// Define component props
interface InviteFriendsDrawerProps {
  /** Controls drawer visibility */
  open: boolean; //
  /** User's referral code */
  code: string; //
  /** Callback to close the drawer */
  onClose: () => void; //
}

/**
 * A modal drawer component that slides up to allow users to copy or share
 * their referral code. Includes drag-to-close functionality.
 */
export function InviteFriendsDrawer({
  open,
  code,
  onClose,
}: InviteFriendsDrawerProps) {
  //
  const [mounted, setMounted] = React.useState(false); // Track if component is mounted for portal
  const drawerRef = React.useRef<HTMLDivElement | null>(null); // Ref for the drawer element

  // --- Drag-to-Close State & Logic ---
  const startY = React.useRef<number | null>(null); // Stores initial Y position on pointer down
  const [dragY, setDragY] = React.useState(0); // Stores current drag offset (positive downwards)
  const isDragging = startY.current !== null; // Boolean flag if currently dragging

  // Ensure portal only renders client-side
  React.useEffect(() => setMounted(true), []); //

  // --- Side Effects ---
  // Lock/unlock body scroll when drawer opens/closes
  React.useEffect(() => {
    //
    if (!open) {
      //
      document.documentElement.style.overflow = ""; // Restore scroll
      return; //
    }
    document.documentElement.style.overflow = "hidden"; // Disable scroll
    return () => {
      // Cleanup
      document.documentElement.style.overflow = ""; // Restore scroll
    };
  }, [open]); //

  // Handle ESC key press to close drawer
  React.useEffect(() => {
    //
    if (!open) return; //
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(); //
    window.addEventListener("keydown", onKey); //
    return () => window.removeEventListener("keydown", onKey); //
  }, [open, onClose]); //

  // --- Drag Handlers ---
  const onPointerDown = React.useCallback((e: React.PointerEvent) => {
    // Use useCallback
    // Only allow dragging on the drawer handle/header area if desired,
    // otherwise dragging anywhere on the drawer works.
    // Example: Check if target is within header bounds
    // const header = drawerRef.current?.querySelector('[data-drag-handle]');
    // if (header && !header.contains(e.target as Node)) return;

    startY.current = e.clientY; // Record starting Y position
    setDragY(0); // Reset drag offset
    // Capture pointer events on the drawer element
    drawerRef.current?.setPointerCapture(e.pointerId); //
  }, []); // Empty dependency array

  const onPointerMove = React.useCallback((e: React.PointerEvent) => {
    // Use useCallback
    if (startY.current == null) return; // Ignore if not dragging
    // Calculate vertical drag distance, ensuring it's non-negative (only drags down)
    const dy = Math.max(0, e.clientY - startY.current); //
    setDragY(dy); // Update drag offset state
  }, []); // Empty dependency array

  const onPointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      // Use useCallback
      if (startY.current == null) return; // Ignore if not dragging
      // Release pointer capture
      drawerRef.current?.releasePointerCapture(e.pointerId); // Good practice

      const dy = dragY; // Get final drag offset
      startY.current = null; // Reset starting position
      setDragY(0); // Reset drag offset state
      // If dragged down significantly (e.g., > 140px), trigger close
      if (dy > 140) onClose(); //
    },
    [dragY, onClose]
  ); // Dependencies: dragY, onClose

  // --- Action Handlers ---
  // Copy code to clipboard
  const copyCode = React.useCallback(async () => {
    // Use useCallback
    if (!navigator.clipboard) {
      notify.error("Clipboard not available."); // Fallback message
      return;
    }
    try {
      await navigator.clipboard.writeText(code); //
      notify.success("Code copied!"); // Use Sonner notification
    } catch (err) {
      console.error("Failed to copy code:", err);
      notify.error("Couldn’t copy code."); // Use Sonner notification
    }
  }, [code]); // Dependency: code

  // Share code using Web Share API or fallback to copy
  const shareInvite = React.useCallback(async () => {
    // Use useCallback
    const text = `Join me on Waffles — use my invite code: ${code}`; //
    // Check if Web Share API is supported
    if (navigator.share) {
      //
      try {
        await navigator.share({ title: "Waffle Invite", text }); //
        // notify.success("Invite shared!"); // Optional success message (often redundant)
      } catch (err) {
        // Ignore AbortError which happens if user cancels share sheet
        if ((err as DOMException)?.name !== "AbortError") {
          console.error("Failed to share:", err);
          notify.error("Could not share invite.");
        }
      }
    } else {
      // Fallback to copying if Web Share API is not supported
      await copyCode(); //
    }
  }, [code, copyCode]); // Dependencies: code, copyCode

  // Don't render portal server-side
  if (!mounted) return null; //

  // Render into document.body using createPortal
  return createPortal(
    //
    <AnimatePresence>
      {" "}
      {/* Handles mount/unmount animation */}
      {open && ( // Conditionally render based on `open` prop
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            aria-hidden //
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" // Styles
            initial={{ opacity: 0 }} //
            animate={{ opacity: 1 }} //
            exit={{ opacity: 0 }} //
            transition={{ duration: 0.2 }} // Animation timing
            onClick={onClose} // Close on click
          />

          {/* Drawer */}
          <motion.section
            key="drawer"
            ref={drawerRef} // Attach ref
            id="invite-friends-drawer" // ID for potential aria-controls
            role="dialog" // ARIA role
            aria-modal="true" //
            aria-label="Invite friends" //
            onPointerDown={onPointerDown} // Attach drag handlers
            onPointerMove={onPointerMove} //
            onPointerUp={onPointerUp} //
            className={cn(
              // Base styles and conditional transform/opacity
              "fixed inset-x-0 bottom-0 z-[81] isolate", // Position, z-index, isolation
              "mx-auto w-full max-w-screen-sm", // Max width
              "rounded-t-[1.25rem] overflow-hidden", // Styling
              "border-t border-white/5", // Top border
              "bg-gradient-to-b from-[#1E1E1E] to-black", // Background gradient
              "shadow-[0_-20px_60px_rgba(0,0,0,.6)]", // Shadow
              "transition-[transform,opacity] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]" // Default transition (used when not dragging)
            )}
            // Apply drag offset directly via style if dragging, otherwise use motion variants
            style={
              isDragging
                ? {
                    transform: `translateY(${dragY}px)`, // Apply drag offset
                    opacity: Math.max(0.6, 1 - dragY / 800), // Fade slightly on drag
                    transition: "none", // Disable CSS transition while dragging
                  }
                : undefined // Let motion handle transitions when not dragging
            }
            // Motion variants for open/close animation
            initial={{ y: "100%", opacity: 0 }} // Start closed
            animate={{ y: 0, opacity: 1 }} // Animate open
            exit={{ y: "100%", opacity: 0 }} // Animate closed
            transition={{ type: "spring", stiffness: 280, damping: 30 }} // Spring physics
            // Prevent clicks inside drawer propagating to backdrop
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Drag Handle */}
            <div
              className="relative border-b border-white/5 bg-[#191919] px-4 pb-3 pt-6 cursor-grab active:cursor-grabbing" // Add cursor styles
              data-drag-handle // Optional: Add attribute if restricting drag target
            >
              <div
                className="absolute left-1/2 top-3 h-1 w-9 -translate-x-1/2 rounded-full bg-white/40" // Drag handle visual
                aria-hidden //
              />
              {/* Title Area */}
              <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-2">
                {" "}
                {/* */}
                <InviteFriendsIcon className="h-6 w-6 text-waffle-yellow" />{" "}
                {/* */}
                <h2
                  className="font-edit-undo text-white leading-[1.15]" //
                  style={{ fontSize: "clamp(1.05rem, 3.7vw, 1.25rem)" }} // Responsive font size
                >
                  INVITE FRIENDS {/* */}
                </h2>
              </div>{" "}
              {/* */}
            </div>

            {/* Body */}
            <div className="mx-auto flex w-full max-w-xs flex-col gap-3.5 px-4 py-4">
              {" "}
              {/* Padding and gap */}
              {/* Gift + Code Card */}
              <div
                className="rounded-2xl border border-white/10 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,201,49,.12)_100%)] flex flex-col items-center justify-center gap-3 px-3 py-12 sm:py-14" // Styles
              >
                <Image
                  src="/images/icons/gift.svg" // Gift icon
                  alt="" // Decorative
                  width={96} //
                  height={96} //
                  className="w-24 h-24 sm:w-28 sm:h-28" // Responsive size
                  priority // Load eagerly
                />
                <div className="mt-1.5 flex w-full flex-col items-center">
                  {" "}
                  {/* */}
                  <p
                    className="font-display text-muted tracking-[-0.03em]" // Changed font, use muted color
                    style={{
                      fontSize: "clamp(0.95rem, 3vw, 1rem)", // Responsive size
                      lineHeight: "130%", //
                    }}
                  >
                    Your code is {/* */}
                  </p>
                  <p
                    className="font-edit-undo text-white select-all" // Allow selecting the code easily
                    style={{
                      fontSize: "clamp(1.9rem, 6vw, 2.375rem)", // Responsive size
                      lineHeight: "1.3", //
                    }}
                  >
                    {code || "------"} {/* Display code or placeholder */}
                  </p>
                </div>
              </div>
              {/* Share Button */}
              <FancyBorderButton
                onClick={shareInvite}
                className="border-waffle-gold"
                disabled={!code || code === "------"}
              >
                {" "}
                {/* Disable if no code */}
                SHARE INVITE {/* */}
              </FancyBorderButton>
              {/* Copy Button */}
              <button
                onClick={copyCode} //
                disabled={!code || code === "------"} // Disable if no code
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 transition hover:bg-white/5 active:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed" // Added hover/active/disabled states
              >
                <CopyIcon /> {/* */}
                <span
                  className="font-edit-undo text-[#00CFF2] tracking-[-0.02em]" // Cyan text
                  style={{
                    fontSize: "clamp(1rem, 3.2vw, 1.125rem)", // Responsive size
                    lineHeight: "1.15", //
                  }}
                >
                  COPY CODE {/* */}
                </span>
              </button>
              {/* Spacer for bottom safe area, handled by parent padding potentially */}
              {/* <div className="h-[calc(env(safe-area-inset-bottom)+1rem)]" /> */}
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>,
    document.body // Render into body
  );
} //
