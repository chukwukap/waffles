"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * ScrollProgress - Fixed progress bar showing scroll position
 * Uses brand gold color gradient for visual consistency
 */
export function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-[3px] z-[9997] origin-left"
            style={{
                scaleX,
                background: "linear-gradient(90deg, #FFC931 0%, #FFE082 50%, #FFC931 100%)",
            }}
        />
    );
}
