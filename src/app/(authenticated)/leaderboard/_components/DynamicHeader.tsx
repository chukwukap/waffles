// src/components/leaderboard/DynamicHeader.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";

const CROWN_AREA_HEIGHT = 160; // Approximate height in pixels of the crown area

interface DynamicHeaderProps {
  scrollRef: React.RefObject<HTMLElement>;
}

export function DynamicHeader({ scrollRef }: DynamicHeaderProps) {
  const [isSticky, setIsSticky] = useState(false);

  const { scrollY } = useScroll({ container: scrollRef });

  // Animate opacity: fade out from scrollY 0 to 60px
  const crownOpacity = useTransform(scrollY, [0, 60], [1, 0]);
  // Animate vertical position: move up 50px as it fades
  const crownY = useTransform(scrollY, [0, 60], [0, -50]);

  // Listen for scroll changes to toggle the sticky state
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsSticky(latest > CROWN_AREA_HEIGHT);
  });

  return (
    <header className="relative">
      {/* This is the animated crown area */}
      <motion.div
        style={{ opacity: crownOpacity, y: crownY }}
        className="flex flex-col items-center justify-center pt-8 pb-4"
      >
        <Image
          src="/images/chest-crown.png"
          alt="Leaderboard Chest"
          width={128}
          height={128}
          priority
        />
      </motion.div>

      {/* This is the LEADERBOARD title that becomes sticky */}
      <div
        className={`transition-shadow duration-200 ${
          isSticky
            ? "sticky top-0 z-10 bg-background py-4 shadow-lg shadow-black/20"
            : "relative bg-transparent py-4"
        }`}
      >
        <h1 className="text-center text-2xl uppercase tracking-widest">
          Leaderboard
        </h1>
      </div>
    </header>
  );
}
