"use client";

import { Variants } from "framer-motion";

/**
 * World-class animation presets for Waffles landing page
 * Based on research of top web3 projects and Framer Motion best practices
 */

// Spring physics presets for natural, organic motion
export const springPresets = {
    gentle: { stiffness: 120, damping: 14 },
    snappy: { stiffness: 400, damping: 30 },
    bouncy: { stiffness: 300, damping: 10 },
    slow: { stiffness: 50, damping: 20 },
    magnetic: { stiffness: 150, damping: 15, mass: 0.1 },
};

// Stagger timing for orchestrated animations
export const staggerConfig = {
    fast: { staggerChildren: 0.05, delayChildren: 0.1 },
    normal: { staggerChildren: 0.08, delayChildren: 0.2 },
    slow: { staggerChildren: 0.12, delayChildren: 0.3 },
};

// Fade up animation variant (most common)
export const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
};

// Fade in scale variant for emphasis
export const fadeScaleVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
};

// Stagger container for child animations
export const staggerContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

// Stagger child item
export const staggerItemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
};

// Word-by-word stagger for headlines
export const wordStaggerVariants: Variants = {
    hidden: { opacity: 0, y: 40, rotateX: -15 },
    visible: {
        opacity: 1,
        y: 0,
        rotateX: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
};

// Floating animation for idle elements (coins, character)
export const floatingVariants: Variants = {
    initial: { y: 0 },
    animate: {
        y: [-8, 8, -8],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

// Gentle rotation for coins
export const gentleRotateVariants: Variants = {
    initial: { rotate: 0 },
    animate: {
        rotate: [-2, 2, -2],
        transition: {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

// Pulse animation for CTAs
export const pulseVariants: Variants = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.02, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

// Glow pulse for attention-grabbing elements
export const glowPulseVariants: Variants = {
    initial: { boxShadow: "0 0 0 rgba(255, 201, 49, 0)" },
    animate: {
        boxShadow: [
            "0 0 20px rgba(255, 201, 49, 0.3)",
            "0 0 40px rgba(255, 201, 49, 0.5)",
            "0 0 20px rgba(255, 201, 49, 0.3)",
        ],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

// Slide from left
export const slideFromLeftVariants: Variants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
};

// Slide from right
export const slideFromRightVariants: Variants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
};

// For reduced motion preferences
export const reducedMotionVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
};

// Utility to split text into words for staggered animation
export function splitTextIntoWords(text: string): string[] {
    return text.split(" ").filter(Boolean);
}

// Viewport settings for consistent scroll triggers
export const defaultViewport = { once: true, margin: "-100px" };
export const earlyViewport = { once: true, margin: "-50px" };
