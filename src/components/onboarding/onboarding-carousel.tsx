"use client";

import { useState } from "react";
import { OnboardingSlide } from "./onboarding-slide";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";

interface Slide {
  icon: string;
  title: string;
  description: string;
}

const slides: Slide[] = [
  {
    icon: "/images/illustration/waffle-ticket.png",
    title: "Buy a Waffle",
    description:
      "Buy your ticket, play the game, and share in the prize pool with other winners",
  },
  {
    icon: "/images/illustration/money-bag.png",
    title: "Win Big",
    description: "The faster you connect the dots, the bigger your share",
  },
  {
    icon: "/images/illustration/crown.png",
    title: "Take Your",
    description: "Recognize the images, climb the leaderboard. EZ",
  },
];

interface OnboardingCarouselProps {
  onComplete: () => void;
}

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center">
        <OnboardingSlide
          key={currentSlide}
          icon={slides[currentSlide].icon}
          title={slides[currentSlide].title}
          description={slides[currentSlide].description}
        />
      </div>

      <div className="p-6 space-y-3">
        <FancyBorderButton onClick={handleNext} className="w-full">
          {currentSlide === 0 ? "Next" : "Let's Go"}
        </FancyBorderButton>
      </div>
    </div>
  );
}


