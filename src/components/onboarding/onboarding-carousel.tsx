"use client";

import { useState } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { OnboardingSlide } from "./onboarding-slide";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { cn } from "@/lib/utils";

interface Slide {
  icon: string;
  title: string;
  description: string;
}

const slides: Slide[] = [
  {
    icon: "/images/illustrations/waffle-ticket.png",
    title: "Buy a Waffle",
    description:
      "Buy your ticket, play the game, and share in the prize pool with other winners",
  },
  {
    icon: "/images/illustrations/money-bag.png",
    title: "Win Big",
    description: "The faster you connect the dots, the bigger your share",
  },
  {
    icon: "/images/illustrations/crown.png",
    title: "Take Your Crown",
    description: "Recognize the images, climb the leaderboard. EZ",
  },
];

interface OnboardingCarouselProps {
  onComplete: () => void;
}

// Animation variants for Framer Motion
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

/**
 * Renders a simple carousel for onboarding steps.
 * Manages the current slide index and transitions between slides.
 */
export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Handler for the next/complete button
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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 flex items-center justify-center relative">
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
            <OnboardingSlide
              icon={currentSlide.icon}
              title={currentSlide.title}
              description={currentSlide.description}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Controls Area (Dots and Button) */}
      <div className="p-6 space-y-4 mb-10 shrink-0">
        <div className="flex justify-center gap-2 mb-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {}}
              className={cn(
                "h-2 w-2 rounded-full transition-colors duration-200",
                index === currentSlideIndex
                  ? "bg-white"
                  : "bg-white/30 hover:bg-white/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
              disabled={true}
            />
          ))}
        </div>
        <FancyBorderButton onClick={handleNext} className="w-full">
          {currentSlideIndex < slides.length - 1 ? "Next" : "Let's Go"}
        </FancyBorderButton>
      </div>
    </div>
  );
}
