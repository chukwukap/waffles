"use client";

import { ReactNode, useEffect, useRef } from "react";
import Lenis from "lenis";


interface SmoothScrollProviderProps {
    children: ReactNode;
}

/**
 * SmoothScrollProvider - Wraps the app with Lenis for buttery-smooth scrolling
 * Industry standard for award-winning websites
 */
export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2, // Smooth scroll duration
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing function
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            touchMultiplier: 2,
        });

        lenisRef.current = lenis;

        // RAF loop for Lenis
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        // Cleanup
        return () => {
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    return <>{children}</>;
}

/**
 * Hook to access Lenis instance for programmatic scrolling
 */
export function useLenis() {
    const lenisRef = useRef<Lenis | null>(null);
    return lenisRef.current;
}
