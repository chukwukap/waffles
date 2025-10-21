"use client";

import { useEffect, useRef } from "react";

export function useInfiniteLoader(
  onHit: () => void,
  deps: unknown[] = []
): [React.RefObject<HTMLDivElement>] {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) onHit();
      },
      { root: null, rootMargin: "400px 0px 800px 0px", threshold: 0 }
    );

    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [ref as React.RefObject<HTMLDivElement>];
}
