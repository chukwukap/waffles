/**
 * Reusable micro-interaction animations using Framer Motion
 *
 * HOW JITTER WORKS:
 * Jitter creates small, rapid movements that make UI feel alive.
 * Key principles:
 * 1. SUBTLETY - movements should be tiny (1-5px or 1-5deg)
 * 2. SPEED - quick duration (0.1-0.4s) feels responsive
 * 3. PURPOSE - use to indicate interactivity, errors, or success
 * 4. SPRING - spring physics feel more natural than linear
 */

import type { Variants, Transition } from "framer-motion";

// ============================================
// SPRING CONFIGS - Physics for natural motion
// ============================================

export const springs = {
  /** Snappy, responsive - great for buttons */
  snappy: { type: "spring", stiffness: 400, damping: 25 } as const,
  /** Bouncy - playful feel for games */
  bouncy: { type: "spring", stiffness: 300, damping: 15 } as const,
  /** Gentle - subtle, professional */
  gentle: { type: "spring", stiffness: 200, damping: 20 } as const,
  /** Wobbly - fun error shake */
  wobbly: { type: "spring", stiffness: 500, damping: 10 } as const,
} satisfies Record<string, Transition>;

// ============================================
// TAP/CLICK ANIMATIONS
// ============================================

/** Quick press-down effect */
export const tapScale = {
  scale: 0.95,
  transition: springs.snappy,
};

/** Bouncy tap with slight rotation */
export const tapBounce = {
  scale: 0.92,
  rotate: -2,
  transition: springs.bouncy,
};

// ============================================
// HOVER ANIMATIONS
// ============================================

/** Subtle lift on hover */
export const hoverLift = {
  y: -2,
  scale: 1.02,
  transition: springs.gentle,
};

/** Glow pulse effect (combine with CSS glow) */
export const hoverGlow = {
  scale: 1.05,
  transition: springs.gentle,
};

// ============================================
// JITTER/SHAKE ANIMATIONS
// ============================================

/** Error shake - horizontal wiggle */
export const shakeX: Variants = {
  shake: {
    x: [0, -8, 8, -6, 6, -4, 4, 0],
    transition: { duration: 0.4, ease: "easeInOut" },
  },
};

/** Attention wiggle - rotation jitter */
export const wiggle: Variants = {
  wiggle: {
    rotate: [0, -3, 3, -2, 2, -1, 1, 0],
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

/** Pulse - scale breathing effect */
export const pulse: Variants = {
  pulse: {
    scale: [1, 1.08, 1],
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

/** Jitter - tiny random movement (continuous) */
export const jitterContinuous: Variants = {
  jitter: {
    x: [0, 1, -1, 1, 0],
    y: [0, -1, 1, -1, 0],
    transition: {
      duration: 0.15,
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

// ============================================
// ENTRANCE ANIMATIONS (for staggered lists)
// ============================================

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.wobbly,
  },
};

// ============================================
// CONTAINER VARIANTS (for staggered children)
// ============================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

// ============================================
// UTILITY: Trigger animation programmatically
// ============================================

/**
 * Use with useAnimation hook from framer-motion
 *
 * Example:
 * ```tsx
 * const controls = useAnimation();
 *
 * const handleError = () => {
 *   triggerShake(controls);
 * };
 *
 * <motion.div animate={controls} variants={shakeX}>
 * ```
 */
export const triggerShake = async (controls: {
  start: (variant: string) => Promise<void>;
}) => {
  await controls.start("shake");
};

export const triggerWiggle = async (controls: {
  start: (variant: string) => Promise<void>;
}) => {
  await controls.start("wiggle");
};

export const triggerPulse = async (controls: {
  start: (variant: string) => Promise<void>;
}) => {
  await controls.start("pulse");
};
