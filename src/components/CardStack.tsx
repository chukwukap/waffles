"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionTemplate,
} from "framer-motion";

interface CardStackProps {
  images: { src: string; alt?: string }[];
  /** Can be number (px) or CSS string: 'clamp()', '5vw', '3rem', etc */
  size?: number | string; // default 'clamp(32px, 6vw, 48px)'
  borderColor?: string; // default '#FFFFFF'
  rotations?: number[]; // default figure-like: [-9, 6, -4, 7]
  interactive?: boolean;
  maxCards?: number;
  ariaLabel?: string;
}

export function CardStack({
  images,
  size = "clamp(32px, 6vw, 48px)",
  borderColor = "#FFFFFF",
  rotations = [-9, 6, -4, 7],
  interactive = false,
  maxCards = 4,
  ariaLabel = "image cards stack",
}: CardStackProps) {
  const x = useMotionValue(0);
  const tilt = useTransform(x, [-200, 200], [-4, 4]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    x.set(e.clientX - (rect.left + rect.width / 2));
  };
  const handleLeave = () => interactive && x.set(0);

  const cards = useMemo(() => images.slice(0, maxCards), [images, maxCards]);

  return (
    <motion.div
      ref={containerRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      aria-label={ariaLabel}
      className="relative flex items-center"
      style={{ gap: 0 }}
    >
      {cards.map((img, i) => {
        // --- Responsive CSS variables derived from size ---
        const base = `var(--card-size)`;
        const border = `calc(${base} * 0.07)`; // ~7%
        const radius = `calc(${base} * 0.14)`; // ~14%
        const overlap = `calc(${base} * 0.52)`; // ~52%

        const staticRotation = rotations[i % rotations.length] ?? 0;
        const motionRotation = interactive
          ? useMotionTemplate`${tilt}deg`
          : undefined;

        return (
          <motion.div
            key={img.src + i}
            style={{
              // 🎯 set CSS variable so everything scales from `size`
              ["--card-size" as any]:
                typeof size === "number" ? `${size}px` : size,
              width: base,
              height: base,
              marginLeft: i === 0 ? 0 : `calc(-1 * ${overlap})`,
              borderColor,
              borderWidth: border,
              borderRadius: radius,
              rotate: interactive ? undefined : `${staticRotation}deg`,
              zIndex: 10 + i,
            }}
            className="shrink-0 border bg-[#F0F3F4] overflow-hidden"
            whileHover={interactive ? { y: -1 } : undefined}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <motion.div
              style={{
                width: "100%",
                height: "100%",
                rotate: interactive ? motionRotation : 0,
              }}
              className="w-full h-full"
            >
              <Image
                src={img.src}
                alt={img.alt ?? "image card"}
                fill
                className="object-cover"
              />
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
