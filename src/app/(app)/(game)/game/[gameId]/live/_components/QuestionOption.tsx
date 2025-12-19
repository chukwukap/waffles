"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PixelButton } from "@/components/ui/PixelButton";

// Color themes for each answer option (matches Figma design)
const optionColorThemes = ["gold", "purple", "cyan", "green"] as const;

// Staggered entrance animation variant
const optionVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

interface QuestionOptionProps {
  option: string;
  index: number;
  selectedOptionIndex: number | null;
  onSelect: (index: number) => void;
  disabled: boolean;
}

export function QuestionOption({
  option,
  index,
  selectedOptionIndex,
  onSelect,
  disabled,
}: QuestionOptionProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isSelected = selectedOptionIndex === index;
  const hasSelection = selectedOptionIndex !== null;

  const handleClick = () => {
    if (disabled) return;
    onSelect(index);
  };

  // Cycle through color themes based on index
  const colorTheme = optionColorThemes[index % optionColorThemes.length];

  return (
    <motion.li
      className={cn(
        "mx-auto flex justify-center",
        // Has selection - selected option scales up
        hasSelection && isSelected && "z-10",
      )}
      variants={optionVariants}
      // Press and hover animations
      animate={{
        scale: isPressed
          ? 0.95
          : hasSelection && isSelected
            ? 1.15
            : isHovered && !disabled
              ? 1.03
              : 1,
        opacity: hasSelection && !isSelected ? 0.3 : 1,
        y: isHovered && !disabled && !hasSelection ? -2 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      // Touch support
      onTouchStart={() => !disabled && setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      <motion.div
        // Subtle glow on hover
        animate={{
          boxShadow:
            isHovered && !disabled && !hasSelection
              ? "0 4px 20px rgba(255, 201, 49, 0.25)"
              : "0 0 0px rgba(255, 201, 49, 0)",
        }}
        transition={{ duration: 0.2 }}
        className="rounded-lg"
      >
        <PixelButton
          aria-pressed={isSelected}
          tabIndex={-1}
          variant="filled"
          colorTheme={colorTheme}
          width={296}
          height={48}
          fontSize={14}
          onClick={handleClick}
          disabled={disabled}
        >
          {option}
        </PixelButton>
      </motion.div>
    </motion.li>
  );
}
