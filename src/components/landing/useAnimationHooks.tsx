"use client";

import { useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { springPresets } from "./AnimationContext";

/**
 * Magnetic button hook - creates a cursor-following effect
 * When cursor is near the element, it subtly follows the cursor
 */
export function useMagneticEffect(strength: number = 0.3) {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springX = useSpring(x, springPresets.magnetic);
    const springY = useSpring(y, springPresets.magnetic);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const distanceX = e.clientX - centerX;
            const distanceY = e.clientY - centerY;

            // Only apply effect if cursor is within threshold
            const threshold = Math.max(rect.width, rect.height) * 1.5;
            const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

            if (distance < threshold) {
                x.set(distanceX * strength);
                y.set(distanceY * strength);
            } else {
                x.set(0);
                y.set(0);
            }
        };

        const handleMouseLeave = () => {
            x.set(0);
            y.set(0);
        };

        window.addEventListener("mousemove", handleMouseMove);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            element.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [x, y, strength]);

    return { ref, x: springX, y: springY };
}

/**
 * Mouse parallax hook - subtle movement based on cursor position
 * Creates depth effect across entire section
 */
export function useMouseParallax(intensity: number = 20) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    // Transform for different layer depths
    const layer1X = useTransform(springX, [-1, 1], [-intensity, intensity]);
    const layer1Y = useTransform(springY, [-1, 1], [-intensity, intensity]);
    const layer2X = useTransform(springX, [-1, 1], [-intensity * 0.5, intensity * 0.5]);
    const layer2Y = useTransform(springY, [-1, 1], [-intensity * 0.5, intensity * 0.5]);
    const layer3X = useTransform(springX, [-1, 1], [-intensity * 0.25, intensity * 0.25]);
    const layer3Y = useTransform(springY, [-1, 1], [-intensity * 0.25, intensity * 0.25]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            mouseX.set(x);
            mouseY.set(y);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    return {
        layer1: { x: layer1X, y: layer1Y },
        layer2: { x: layer2X, y: layer2Y },
        layer3: { x: layer3X, y: layer3Y },
    };
}

/**
 * Scroll-aware visibility hook
 * Show element when scrolling up, hide when scrolling down
 */
export function useScrollDirection() {
    const [isVisible, setIsVisible] = useState(true);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const isScrollingUp = currentScrollY < lastScrollY;

            // Only hide after scrolling past threshold
            if (currentScrollY > 100) {
                setIsVisible(isScrollingUp);
            } else {
                setIsVisible(true);
            }

            setScrollY(currentScrollY);
            lastScrollY = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return { isVisible, scrollY };
}

/**
 * Hook for scroll-linked blur effect
 */
export function useScrollBlur(maxBlur: number = 20) {
    const [blur, setBlur] = useState(12);

    useEffect(() => {
        const handleScroll = () => {
            const scrollProgress = Math.min(window.scrollY / 300, 1);
            setBlur(12 + scrollProgress * (maxBlur - 12));
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [maxBlur]);

    return blur;
}
