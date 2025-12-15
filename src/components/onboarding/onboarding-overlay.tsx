"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import confetti from "canvas-confetti";
import { springs, tapBounce } from "@/lib/animations";

interface OnboardingOverlayProps {
  onComplete: () => void;
}

interface Slide {
  icon: string;
  title: string;
  description: React.ReactNode;
  /** Emoji for celebration */
  emoji: string;
}

const slides: Slide[] = [
  {
    icon: "/images/illustrations/waffle-ticket.png",
    title: "Buy a Waffle",
    description: (
      <>
        Buy your ticket, play the game, and share in
        <br />
        the prize pool with other winners
      </>
    ),
    emoji: "🎫",
  },
  {
    icon: "/images/illustrations/money-bag.png",
    title: "Win Big",
    description: (
      <>
        The faster you connect the dots, the
        <br />
        bigger your share
      </>
    ),
    emoji: "💰",
  },
  {
    icon: "/images/illustrations/crown.png",
    title: "Take Your Crown",
    description: (
      <>
        Recognize the images, climb the
        <br />
        leaderboard. EZ
      </>
    ),
    emoji: "👑",
  },
];

// ============================================
// FLOATING PARTICLES
// ============================================
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            background:
              i % 3 === 0
                ? "rgba(251, 191, 36, 0.4)"
                : i % 3 === 1
                  ? "rgba(139, 92, 246, 0.3)"
                  : "rgba(59, 130, 246, 0.3)",
            left: `${5 + i * 6}%`,
            top: `${15 + (i % 5) * 18}%`,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, i % 2 === 0 ? 15 : -15, 0],
            opacity: [0.2, 0.7, 0.2],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}

      {/* Glowing orbs */}
      <motion.div
        className="absolute w-40 h-40 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)",
          top: "20%",
          left: "-10%",
        }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          bottom: "10%",
          right: "-15%",
        }}
        animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </div>
  );
}

// ============================================
// PROGRESS DOTS
// ============================================
function ProgressDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex gap-2 justify-center mt-6">
      {[...Array(total)].map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          initial={false}
          animate={{
            width: i === current ? 24 : 8,
            backgroundColor: i === current ? "#FFC931" : "rgba(255,255,255,0.3)",
          }}
          transition={springs.bouncy}
          style={{ height: 8 }}
        />
      ))}
    </div>
  );
}

// ============================================
// ANIMATED ILLUSTRATION
// ============================================
function AnimatedIllustration({
  src,
  alt,
  emoji,
}: {
  src: string;
  alt: string;
  emoji: string;
}) {
  return (
    <motion.div
      className="relative w-[262px] h-[177px]"
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ ...springs.bouncy, delay: 0.1 }}
    >
      {/* Glow behind illustration */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 60%)",
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main illustration with float */}
      <motion.div
        className="relative w-full h-full"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image src={src} alt={alt} fill className="object-contain" priority />
      </motion.div>

      {/* Floating emoji */}
      <motion.span
        className="absolute -top-2 -right-2 text-2xl"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...springs.wobbly, delay: 0.4 }}
      >
        {emoji}
      </motion.span>
    </motion.div>
  );
}

// ============================================
// MAIN OVERLAY
// ============================================
export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const buttonControls = useAnimation();

  const currentSlide = slides[currentSlideIndex];
  const isLastSlide = currentSlideIndex === slides.length - 1;

  // Celebrate on last slide
  useEffect(() => {
    if (isLastSlide) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#FFC931", "#8B5CF6", "#3B82F6"],
      });
    }
  }, [isLastSlide]);

  // Periodic button attention pulse
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        buttonControls.start({
          scale: [1, 1.03, 1],
          transition: { duration: 0.3 },
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [buttonControls, isLoading]);

  const handleNext = async () => {
    setDirection(1);
    if (!isLastSlide) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      setIsLoading(true);
      try {
        // Final celebration
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#FFC931", "#8B5CF6", "#3B82F6", "#22C55E"],
        });
        await onComplete();
      } catch (error) {
        console.error("Onboarding failed:", error);
        setIsLoading(false);
      }
    }
  };

  // Slide animation variants
  const slideVariants = {
    initial: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 150, damping: 25 },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? "100%" : "-100%",
      opacity: 0,
      transition: { ease: "easeInOut", duration: 0.25 },
    }),
  };

  return (
    <motion.div
      className="inset-0 z-81 flex flex-col pt-8 app-background fixed!"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background effects */}
      <FloatingParticles />

      {/* Logo with entrance */}
      <motion.div
        className="flex shrink-0 items-center justify-center p-2 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.gentle, delay: 0.2 }}
      >
        <h1 id="onboarding-title" className="sr-only">
          Onboarding
        </h1>
        <motion.div
          className="relative w-[123px] h-[24px]"
          whileHover={{ scale: 1.05 }}
          whileTap={tapBounce}
        >
          <Image
            src="/logo-onboarding.png"
            alt="Waffles Logo"
            fill
            sizes="123px"
            priority
            className="object-contain"
          />
        </motion.div>
      </motion.div>

      {/* Slides */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden z-10">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlideIndex}
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-6 text-center w-full">
              {/* Illustration */}
              <AnimatedIllustration
                src={currentSlide.icon}
                alt={currentSlide.title}
                emoji={currentSlide.emoji}
              />

              {/* Text content */}
              <div className="flex flex-col items-center w-full px-4 gap-5">
                <div className="flex flex-col items-center gap-2">
                  {/* Title with stagger */}
                  <motion.h2
                    className="text-[44px] text-white font-normal text-center leading-[0.92] tracking-[-0.03em] font-body"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springs.gentle, delay: 0.2 }}
                  >
                    {currentSlide.title}
                  </motion.h2>

                  {/* Description */}
                  <motion.p
                    className="text-[16px] font-medium font-display text-[#99A0AE] text-center leading-[130%] tracking-[-0.03em] max-w-md text-pretty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springs.gentle, delay: 0.3 }}
                  >
                    {currentSlide.description}
                  </motion.p>
                </div>

                {/* Progress dots */}
                <ProgressDots total={slides.length} current={currentSlideIndex} />

                {/* CTA Button */}
                <motion.div
                  className="w-full"
                  animate={buttonControls}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ ...springs.bouncy, delay: 0.4 }}
                >
                  <FancyBorderButton
                    onClick={handleNext}
                    disabled={isLoading}
                    className="text-[26px] text-[#1E1E1E] w-full max-w-full"
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={isLoading ? "loading" : isLastSlide ? "go" : "next"}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <motion.span
                              className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                            Loading...
                          </>
                        ) : isLastSlide ? (
                          <>Let&apos;s Go 🚀</>
                        ) : (
                          <>Next →</>
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </FancyBorderButton>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
