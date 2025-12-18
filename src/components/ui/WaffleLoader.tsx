"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WaffleLoaderProps {
  className?: string;
  text?: string;
  subtext?: string;
  size?: number;
}

// Animated Hourglass SVG Component with micro-interactions
function AnimatedHourglass({ size = 68 }: { size?: number }) {
  return (
    <motion.div
      animate={{
        rotate: [0, 0, 180, 180, 360],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.2, 0.5, 0.7, 1],
      }}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 53 68"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main hourglass image */}
        <image
          href="/images/icons/hourglass.svg"
          width="53"
          height="68"
          preserveAspectRatio="xMidYMid slice"
        />

        {/* Animated sand particles falling */}
        <motion.circle
          cx="26.5"
          cy="34"
          r="1.5"
          fill="#FFD93D"
          animate={{
            cy: [30, 45],
            opacity: [1, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "linear",
            delay: 0,
          }}
        />
        <motion.circle
          cx="26.5"
          cy="34"
          r="1"
          fill="#FFD93D"
          animate={{
            cy: [30, 45],
            opacity: [1, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "linear",
            delay: 0.3,
          }}
        />
        <motion.circle
          cx="26.5"
          cy="34"
          r="1.2"
          fill="#FFD93D"
          animate={{
            cy: [30, 45],
            opacity: [1, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "linear",
            delay: 0.6,
          }}
        />
      </svg>
    </motion.div>
  );
}

export function WaffleLoader({
  className,
  text = "Loading...",
  subtext = "Please wait",
  size = 68,
}: WaffleLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[80dvh] w-full px-4 text-center",
        className
      )}
    >
      {/* Animated Hourglass with glow effect */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
        className="mb-8 relative"
      >
        {/* Subtle glow behind hourglass */}
        <motion.div
          className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: size * 1.5,
            height: size * 1.5,
            left: -size * 0.25,
            top: -size * 0.25,
          }}
        />
        <AnimatedHourglass size={size} />
      </motion.div>

      {/* Loading Container */}
      <div className="flex flex-col items-center gap-3 max-w-[350px]">
        {/* Title with pulse animation */}
        <motion.h1
          className="font-body text-[32px] leading-none text-white uppercase tracking-wide"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {text}
        </motion.h1>

        {/* Subtext with fade */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-white/60 font-body font-medium tracking-tight"
        >
          {subtext}
        </motion.p>
      </div>
    </div>
  );
}
