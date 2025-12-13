"use client";

import * as React from "react";
import Image from "next/image";
import sdk from "@farcaster/miniapp-sdk";
import { cn } from "@/lib/utils";
import { PALETTES } from "@/lib/constants";

import { useCountdown } from "@/hooks/useCountdown";
import { useSound } from "@/components/providers/SoundContext";
import { QuestionCardHeader } from "./QuestionCardHeader";
import { QuestionOption } from "./QuestionOption";
import type { LiveGameInfoPayload } from "../page";

// Get the specific type for a single question
type Question = LiveGameInfoPayload["questions"][number];

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  duration,
  onComplete,
}: {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  duration: number;
  onComplete: () => void;
}) {
  const [selectedOptionIndex, setSelectedOptionIndex] = React.useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { playSound } = useSound();

  // Track submission status to prevent double submits
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  // Track start time for accurate duration calculation
  const startTimeRef = React.useRef<number>(Date.now());

  // Reset start time when question changes
  React.useEffect(() => {
    startTimeRef.current = Date.now();
    setHasSubmitted(false);
    setSelectedOptionIndex(null);
  }, [question.id]);

  // Helper to submit answer via v1 API
  const submitAnswer = React.useCallback(
    async (index: number | null, timeTakenMs: number) => {
      setIsSubmitting(true);
      try {
        const res = await sdk.quickAuth.fetch(`/api/v1/games/${question.gameId}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.id,
            selectedIndex: index,
            timeTakenMs,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error("Answer submission failed:", errorData.error);
        }
      } catch (error) {
        console.error("Failed to submit answer:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [question.gameId, question.id]
  );

  // Handler for user selecting an option
  const handleSelect = (index: number) => {
    if (isSubmitting) return;

    // 1. Update UI immediately
    setSelectedOptionIndex(index);
    setHasSubmitted(true);

    // 2. Calculate precise time taken
    const now = Date.now();
    const timeTakenMs = Math.min(now - startTimeRef.current, duration * 1000);

    // 3. Submit immediately
    submitAnswer(index, timeTakenMs);
  };

  // Handler for timer completion
  const handleTimerComplete = async () => {
    // If timer runs out and we haven't submitted, submit a "timeout" (no answer)
    if (!hasSubmitted) {
      setHasSubmitted(true);
      await submitAnswer(null, duration * 1000);
    }

    // Always trigger completion (navigation) when timer ends
    onComplete();
  };

  const { remaining, start, reset } = useCountdown(
    duration,
    handleTimerComplete,
    false
  );

  // Play sound on question change
  React.useEffect(() => {
    if (!question || !question.soundUrl) return;
    playSound(question.soundUrl, { volume: 0.8 });
  }, [playSound, question.id, question.soundUrl]);

  // Start the countdown when the component mounts
  React.useEffect(() => {
    reset();
    start();
    startTimeRef.current = Date.now();
  }, [reset, start, question.id]);

  return (
    <div className="w-full max-w-lg mx-auto mt-2">
      <QuestionCardHeader
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        remaining={remaining}
        duration={duration - 3}
      />

      <section
        className="mx-auto w-full max-w-lg px-4 animate-up"
        aria-live="polite"
      >
        <div
          className="
          mx-auto mb-4 flex items-center justify-center select-none
          w-full max-w-[206px] font-normal text-[36px] leading-[0.92]
          text-center tracking-[-0.03em] text-white font-body
        "
        >
          {question.content}
        </div>

        {question.mediaUrl && (
          <figure className="mx-auto mb-4 flex justify-center w-full">
            <div className="relative w-full max-w-[299px] h-[158px] rounded-[10px] overflow-hidden bg-[#17171a] border border-[#313136] shadow-[0_8px_0_#000]">
              <Image
                src={question.mediaUrl}
                alt={question.content || "Question media"}
                fill
                fetchPriority="high"
                className="object-cover w-full h-full rounded-[10px]"
                sizes="(max-width: 299px) 100vw, 299px"
              />
            </div>
          </figure>
        )}

        <ul className={cn("mx-auto mb-2 flex w-full flex-col gap-2")}>
          {question.options.map((opt, idx) => {
            const palette = PALETTES[idx % PALETTES.length];

            return (
              <QuestionOption
                key={idx}
                option={opt}
                index={idx}
                palette={palette}
                selectedOptionIndex={selectedOptionIndex}
                onSelect={handleSelect}
                disabled={isSubmitting}
              />
            );
          })}
        </ul>

        {selectedOptionIndex !== null && (
          <div
            className={cn(
              "mx-auto text-center font-display font-medium text-[16px] leading-[130%] tracking-[-0.03em] text-[#99A0AE] transition-opacity",
              "opacity-100"
            )}
            aria-live="polite"
          >
            {isSubmitting
              ? "Submitting..."
              : "Answer selected! Waiting for time to run out..."}
          </div>
        )}
      </section>
    </div>
  );
}

export default QuestionCard;
