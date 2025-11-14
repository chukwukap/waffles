"use client";

import { useMemo, useRef, type PointerEventHandler } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardStackProps {
  size?: number | string;
  borderColor?: string;
  rotations?: number[];
  interactive?: boolean;
  maxCards?: number;
  ariaLabel?: string;
  className?: string;
}

const DEFAULT_ROTATIONS = [-9, 6, -4, 7];

export function CardStack({
  size = "clamp(32px, 6vw, 48px)",
  borderColor = "#FFFFFF",
  rotations = DEFAULT_ROTATIONS,
  interactive = false,
  maxCards = 4,
  ariaLabel = "Image card stack",
  className,
}: CardStackProps) {
  const spotsAvatars = useMemo(() => {
    return [
      "/images/lobby/1.jpg",
      "/images/lobby/2.jpg",
      "/images/lobby/3.jpg",
      "/images/lobby/4.jpg",
    ];
  }, []);
  const x = useMotionValue(0);
  const tilt = useTransform(x, [-100, 100], [-4, 4]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove: PointerEventHandler<HTMLDivElement> = (e) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    x.set(e.clientX - (rect.left + rect.width / 2));
  };

  const handleLeave = () => {
    if (interactive) {
      x.set(0);
    }
  };
  const cardsToDisplay = useMemo(
    () => spotsAvatars.slice(0, maxCards),
    [spotsAvatars, maxCards]
  );

  const styleVariables = {
    "--card-size": typeof size === "number" ? `${size}px` : size,
    "--card-border": `calc(var(--card-size) * 0.07)`,
    "--card-radius": `calc(var(--card-size) * 0.14)`,
    "--card-overlap": `calc(var(--card-size) * 0.52)`,
  } as React.CSSProperties;

  return (
    <motion.div
      ref={containerRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      aria-label={ariaLabel}
      className={cn("relative flex items-center justify-center", className)}
      style={styleVariables}
    >
      {cardsToDisplay.map((img, i) => {
        const staticRotation = rotations[i % rotations.length] ?? 0;

        return (
          <motion.div
            key={spotsAvatars[i] + i}
            style={{
              width: "var(--card-size)",
              height: "var(--card-size)",
              marginLeft: i === 0 ? 0 : `calc(-1 * var(--card-overlap))`,
              borderColor: borderColor,
              borderWidth: "var(--card-border)",
              borderRadius: "var(--card-radius)",
              rotate: interactive ? 0 : `${staticRotation}deg`,
              zIndex: 10 + i,
            }}
            className="shrink-0 border bg-muted overflow-hidden relative"
            whileHover={interactive ? { y: -3, scale: 1.02 } : undefined}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <motion.div
              style={{
                width: "100%",
                height: "100%",
                rotate: interactive ? tilt : 0,
              }}
              className="w-full h-full"
            >
              <Image
                src={spotsAvatars[i]}
                alt={`Card ${i + 1}`}
                fill
                sizes="var(--card-size)"
                className="object-cover"
                priority={i < 2}
              />
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
