// ───────────────────────── QuestionCard.tsx ─────────────────────────
"use client";

import * as React from "react";
import { NeccessaryGameInfo } from "../page";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { PixelButton } from "@/components/buttons/PixelButton";
import { PALETTES } from "@/lib/constants";

type QuestionCardProps = {
  question: NeccessaryGameInfo["questions"][number];
  onSelectAnswer: (option: string) => void;
  selectedOption: string | null;
  isSubmitting: boolean; // <-- Now correctly received
};

export default function QuestionCard({
  question,
  onSelectAnswer,
  selectedOption,
  isSubmitting, // <-- Now correctly received
}: QuestionCardProps) {
  // Find the index of the chosen option
  const chosenIdx = React.useMemo(() => {
    return selectedOption ? question.options.indexOf(selectedOption) : null;
  }, [selectedOption, question.options]);

  return (
    <section
      className="mx-auto w-full max-w-screen-sm px-4 pb-8 pt-8 animate-up"
      aria-live="polite"
    >
      {/* Game Title */}
      <div
        className="
          mx-auto
          mb-4
          flex
          items-center
          justify-center
          select-none
          w-[206px]
          font-normal
          text-[36px]
          leading-[0.92]
          text-center
          tracking-[-0.03em]
          text-white
          font-body
          flex-none
          order-0
          grow-0
        "
      >
        Guess the Movie
      </div>

      {/* Image Section */}
      <figure
        className="mx-auto mb-8 w-full flex justify-center"
        style={{ borderRadius: 10 }}
      >
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: "299/158",
            borderRadius: 10,
            maxWidth: 380,
            minWidth: 200,
            background: "#17171a",
            border: "1px solid #313136",
            boxShadow: "0 8px 0 #000",
          }}
        >
          {question.imageUrl ? (
            <Image
              src={question.imageUrl}
              alt={question.text}
              fill
              className="object-cover w-full h-full"
              style={{ borderRadius: 10 }}
              priority
              sizes="(max-width: 600px) 95vw, 380px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted">
              No image available
            </div>
          )}
        </div>
      </figure>

      {/* Options */}
      <ul className={cn("mx-auto flex w-full flex-col gap-4")}>
        {question.options.map((opt, idx) => {
          const isChosen = idx === chosenIdx;
          const palette = PALETTES[idx % PALETTES.length];

          // Determine if the button should be "dimmed" (not selected)
          const isDimmed = selectedOption !== null && !isChosen;

          return (
            <li
              key={idx}
              className={cn(
                "min-w-0 flex justify-center transition-all duration-200 ease-out",
                isChosen && "scale-105 z-10", // Scale up if chosen
                isDimmed && "scale-90 opacity-50" // Scale down and dim if not chosen
              )}
            >
              <PixelButton
                aria-pressed={isChosen}
                tabIndex={-1}
                backgroundColor={palette.bg}
                textColor={palette.text}
                borderColor={palette.border}
                onClick={() => {
                  onSelectAnswer(opt);
                }}
                // Disable all buttons while a submission is in progress
                disabled={isSubmitting}
              >
                <span className="block w-full mx-auto truncate select-none">
                  {opt}
                </span>
              </PixelButton>
            </li>
          );
        })}
      </ul>

      {/* Submitted Footer */}
      {chosenIdx !== null && (
        <div
          className={cn(
            "mx-auto mt-10 text-center text-sm text-white/80 font-semibold transition-opacity md:text-base",
            "opacity-100"
          )}
          aria-live="polite"
        >
          {/* Show "Submitting..." text when the action is pending */}
          {isSubmitting
            ? "Submitting..."
            : "Answer selected! Waiting for time to run out..."}
        </div>
      )}
    </section>
  );
}
