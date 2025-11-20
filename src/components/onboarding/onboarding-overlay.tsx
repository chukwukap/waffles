"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";

interface OnboardingOverlayProps {
  onComplete: () => void;
}

interface Slide {
  icon: string;
  title: string;
  description: React.ReactNode;
}

const slides: Slide[] = [
  {
    icon: "/images/illustrations/waffle-ticket.png",
    title: "Buy a Waffle",
    description:
      (
        <>
          Buy your ticket, play the game, and share in
          <br />
          the prize pool with other winners
        </>
      )
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
  },
];

const slideVariants: Variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 150, damping: 25 },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    transition: { ease: "easeInOut", duration: 0.3 },
  }),
};

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const handleNext = () => {
    setDirection(1);
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      onComplete();
    }
  };

  const currentSlide = slides[currentSlideIndex];

  return (
    <div
      className="inset-0 z-81 flex flex-col pt-8  app-background fixed!"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="flex shrink- items-center justify-center p-2">
        <h1 id="onboarding-title" className="sr-only">
          Onboarding
        </h1>
        <div className="relative w-[123px] h-[24px]">
          <Image
            src="/logo-onboarding.png"
            alt="Waffles Logo"
            fill
            sizes="123px"
            priority
            className="object-contain"
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
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
            <div className="flex flex-col items-center gap-8 text-center w-full">
              <div className="relative w-[262px] h-[177px] ">
                <Image
                  src={currentSlide.icon}
                  alt={currentSlide.title}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div className="flex flex-col items-center w-full px-4 gap-5">
                <div className="flex flex-col items-center gap-1">
                  <h2 className="text-[44px] text-white font-normal text-center leading-[0.92] tracking-[-0.03em] font-body">
                    {currentSlide.title}
                  </h2>
                  <p className="text-[16px] font-medium font-display text-[#99A0AE] text-center leading-[130%] tracking-[-0.03em] max-w-md text-pretty">
                    {currentSlide.description}
                  </p>
                </div>

                <FancyBorderButton
                  onClick={handleNext}
                  className="text-[26px] text-[#1E1E1E] w-full max-w-full"
                >
                  {currentSlideIndex === 0 ? "Next" : "Let's Go"}
                </FancyBorderButton>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
