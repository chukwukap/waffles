"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * CustomCursor - Premium custom cursor with blend mode effect
 * Features:
 * - Smooth spring-based following
 * - Scale up on interactive elements
 * - Blend mode for text inversion
 * - Auto-hides on touch devices
 */
export function CustomCursor() {
    const [isVisible, setIsVisible] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [cursorText, setCursorText] = useState("");

    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    // Spring configuration for smooth following
    const springConfig = { stiffness: 500, damping: 28, mass: 0.5 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        // Check if touch device
        const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) return;

        setIsVisible(true);

        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        // Track hover on interactive elements
        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const interactive = target.closest("a, button, [data-cursor-hover]");
            const cursorTextEl = target.closest("[data-cursor-text]");

            if (interactive) {
                setIsHovering(true);
                if (cursorTextEl) {
                    setCursorText(cursorTextEl.getAttribute("data-cursor-text") || "");
                }
            }
        };

        const handleMouseOut = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const interactive = target.closest("a, button, [data-cursor-hover]");
            if (interactive) {
                setIsHovering(false);
                setCursorText("");
            }
        };

        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mouseover", handleMouseOver);
        document.addEventListener("mouseout", handleMouseOut);

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mouseover", handleMouseOver);
            document.removeEventListener("mouseout", handleMouseOut);
        };
    }, [cursorX, cursorY]);

    if (!isVisible) return null;

    return (
        <>
            {/* Main cursor dot */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            >
                <motion.div
                    className="rounded-full bg-white flex items-center justify-center"
                    animate={{
                        width: isHovering ? 80 : isClicking ? 8 : 12,
                        height: isHovering ? 80 : isClicking ? 8 : 12,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                >
                    {cursorText && isHovering && (
                        <span className="text-black text-xs font-medium uppercase tracking-wider">
                            {cursorText}
                        </span>
                    )}
                </motion.div>
            </motion.div>

            {/* Outer ring - trails behind */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9998]"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            >
                <motion.div
                    className="rounded-full border border-white/30"
                    animate={{
                        width: isHovering ? 100 : 40,
                        height: isHovering ? 100 : 40,
                        opacity: isClicking ? 0 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
            </motion.div>

            {/* Hide default cursor */}
            <style jsx global>{`
        * {
          cursor: none !important;
        }
      `}</style>
        </>
    );
}
