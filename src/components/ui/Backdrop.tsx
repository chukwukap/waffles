"use client";

import { useEffect } from "react";

export default function Backdrop({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Prevent body scroll when backdrop is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  return (
    <div
      onClick={onClose}
      onTouchEnd={(e) => {
        // Prevent ghost clicks on mobile
        e.preventDefault();
        onClose();
      }}
      className={`fixed inset-0 z-40 bg-black/50 transition-all duration-500 ease-in-out
        ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
      style={{
        WebkitTapHighlightColor: "transparent",
        touchAction: "none",
      }}
      aria-hidden={!isOpen}
    />
  );
}
