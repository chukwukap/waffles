"use client";

import { cn } from "@/lib/utils";
import { PixelButton } from "@/components/buttons/PixelButton";
import { useSound } from "@/components/providers/SoundContext";

interface QuestionOptionProps {
  option: string;
  index: number;
  palette: {
    bg: string;
    text: string;
    border: string;
  };
  selectedOptionIndex: number | null;
  onSelect: (index: number) => void;
  disabled: boolean;
}

export function QuestionOption({
  option,
  index,
  palette,
  selectedOptionIndex,
  onSelect,
  disabled,
}: QuestionOptionProps) {
  const { playSound } = useSound();
  const isSubmittedOption =
    selectedOptionIndex !== null && selectedOptionIndex === index;

  const handleClick = () => {
    if (!disabled && selectedOptionIndex === null) {
      playSound("click");
    }
    onSelect(index);
  };

  return (
    <li
      className={cn(
        "w-[296px] mx-auto flex justify-center transition-all duration-200 ease-out",
        selectedOptionIndex === null
          ? "scale-100 opacity-100"
          : isSubmittedOption
          ? "scale-110 z-10"
          : "scale-90 opacity-50"
      )}
    >
      <PixelButton
        aria-pressed={isSubmittedOption}
        tabIndex={-1}
        backgroundColor={palette.bg}
        textColor={palette.text}
        borderColor={palette.border}
        onClick={handleClick}
        disabled={disabled}
      >
        <span
          className="
            block
            w-full
            mx-auto
            truncate
            select-none
            text-[14px]
            text-[#1E1E1E]
            font-medium
            font-display
            leading-[115%]
            text-center
            align-bottom
            tracking-normal
          "
        >
          {option}
        </span>
      </PixelButton>
    </li>
  );
}
