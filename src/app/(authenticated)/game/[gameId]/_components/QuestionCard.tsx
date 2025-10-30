"use client";

import * as React from "react";
import { HydratedGame } from "@/state/types";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { PixelButton } from "@/components/buttons/PixelButton";
import { PALETTES } from "@/lib/constants";

type QuestionCardProps = {
  question: HydratedGame["questions"][0];
  onSelectAnswer: (option: string) => void;
  selectedOption: string | null;
};

export default function QuestionCard({
  question,
  onSelectAnswer,
  selectedOption,
}: QuestionCardProps) {
  const chosenIdx = selectedOption
    ? question.options.indexOf(selectedOption)
    : null;
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

          return (
            <li
              key={idx}
              className={cn(
                "min-w-0 flex justify-center",
                isChosen && "",
                chosenIdx !== null &&
                  chosenIdx !== idx &&
                  "opacity-5000 w-10/12 mx-auto"
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
          Answer submitted! Wait for the next question…
        </div>
      )}
    </section>
  );
}
