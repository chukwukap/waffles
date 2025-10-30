// src/app/(authenticated)/leaderboard/_components/useInfiniteLoader.ts
"use client"; // Explicitly mark as client-side hook

import { useEffect, useRef, type RefObject } from "react"; // Add type import

/**
 * Custom hook to detect when an element scrolls into view, triggering a callback.
 * Useful for implementing infinite scrolling/loading.
 *
 * @param onHit Callback function to execute when the target element becomes visible.
 * @param rootMargin Optional margin around the root viewport to adjust trigger point.
 * @param threshold The visibility threshold (0 to 1) required to trigger `onHit`.
 * @param deps Dependency array to re-initialize the observer if needed.
 * @returns A ref object to attach to the target DOM element.
 */
export function useInfiniteLoader(
  onHit: () => void, // Callback when element is visible
  rootMargin: string = "400px 0px 800px 0px", // Default trigger margin (preload early)
  threshold: number = 0, // Trigger as soon as any part is visible
  deps: unknown[] = [] // Dependencies for re-running useEffect
): [RefObject<HTMLDivElement>] {
  // Explicit return type
  const ref = useRef<HTMLDivElement>(null); // Ref for the target element

  useEffect(() => {
    const element = ref.current; // Get the current element from the ref
    if (!element) return; // Exit if element is not yet available

    // Create an Intersection Observer instance
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Callback executed when intersection status changes
        if (entry.isIntersecting) {
          // If the element is intersecting the viewport (or rootMargin)
          onHit(); // Call the provided callback function
        }
      },
      {
        root: null, // Observe intersection relative to the browser viewport
        rootMargin: rootMargin, // Use the provided or default margin
        threshold: threshold, // Use the provided or default threshold
      }
    );

    // Start observing the target element
    observer.observe(element); //

    // Cleanup function: disconnect the observer when the component unmounts
    // or when dependencies change, preventing memory leaks.
    return () => observer.disconnect(); //

    // Re-run the effect if `onHit`, `rootMargin`, `threshold`, or any elements in `deps` change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onHit, rootMargin, threshold, ...deps]); // Include all relevant dependencies

  // Return the ref to be attached to the target DOM element
  return [ref as RefObject<HTMLDivElement>]; //
}
