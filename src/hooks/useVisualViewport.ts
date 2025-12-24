"use client";

import { useState, useEffect } from "react";

/**
 * Hook to track the visual viewport and detect keyboard visibility on mobile.
 * Uses the Visual Viewport API to accurately detect when the on-screen keyboard
 * is open on iOS and Android devices.
 */
export function useVisualViewport() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // Store the initial viewport height
    const initialHeight = window.visualViewport?.height ?? window.innerHeight;
    setViewportHeight(initialHeight);

    const handleViewportResize = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      const currentHeight = viewport.height;
      const heightDifference = initialHeight - currentHeight;

      // Consider keyboard open if height reduced by more than 100px
      const keyboardVisible = heightDifference > 100;

      setViewportHeight(currentHeight);
      setKeyboardHeight(keyboardVisible ? heightDifference : 0);
      setIsKeyboardOpen(keyboardVisible);
    };

    // Listen to visual viewport changes
    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener("resize", handleViewportResize);
      viewport.addEventListener("scroll", handleViewportResize);
    }

    // Fallback for browsers without Visual Viewport API
    window.addEventListener("resize", handleViewportResize);

    return () => {
      if (viewport) {
        viewport.removeEventListener("resize", handleViewportResize);
        viewport.removeEventListener("scroll", handleViewportResize);
      }
      window.removeEventListener("resize", handleViewportResize);
    };
  }, []);

  return {
    keyboardHeight,
    isKeyboardOpen,
    viewportHeight,
  };
}

export default useVisualViewport;
