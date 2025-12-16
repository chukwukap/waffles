"use client";

import * as React from "react";
import Image from "next/image";
import sdk from "@farcaster/miniapp-sdk";
import { cn } from "@/lib/utils";
import { PALETTES } from "@/lib/constants";

import { useCountdown } from "@/hooks/useCountdown";
import { QuestionCardHeader } from "./QuestionCardHeader";
import { QuestionOption } from "./QuestionOption";
import type { LiveGameQuestion } from "../page";

// ==========================================
// PROPS
// ==========================================

interface QuestionCardProps {
  question: LiveGameQuestion;
  gameId: number;  // Added for API calls
  questionNumber: number;
  totalQuestions: number;
  onComplete: () => void;
  onAnswer: (selectedIndex: number, isCorrect: boolean, points: number) => void;
}

// ==========================================
// COMPONENT
// ==========================================

export function QuestionCard({
  question,
  gameId,
  questionNumber,
  totalQuestions,
  onComplete,
  onAnswer,
}: QuestionCardProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const startTimeRef = React.useRef<number>(Date.now());

  // Reset on question change
  React.useEffect(() => {
    startTimeRef.current = Date.now();
    setHasSubmitted(false);
    setSelectedIndex(null);
    setIsSubmitting(false);
  }, [question.id]);

  // Countdown
  const targetMs = startTimeRef.current + question.durationSec * 1000;
  const { seconds, isComplete } = useCountdown(targetMs, {
    onComplete: async () => {
      // Submit timeout if no answer
      if (!hasSubmitted) {
        setHasSubmitted(true);
        await submitAnswer(null);
      }
      onComplete();
    },
  });

  // Submit answer to API
  const submitAnswer = React.useCallback(
    async (index: number | null) => {
      setIsSubmitting(true);
      const timeTakenMs = Date.now() - startTimeRef.current;

      try {
        await sdk.quickAuth.fetch(`/api/v1/games/${gameId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.id,
            selectedIndex: index,
            timeMs: timeTakenMs,
          }),
        });
      } catch (error) {
        console.error("Failed to submit answer:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [gameId, question.id]
  );

  // Handle selection
  const handleSelect = React.useCallback(
    async (index: number) => {
      if (hasSubmitted || isSubmitting) return;

      setSelectedIndex(index);
      setHasSubmitted(true);

      const isCorrect = index === question.correctIndex;

      // Optimistic callback
      onAnswer(index, isCorrect, isCorrect ? question.points : 0);

      // Submit to server
      await submitAnswer(index);
    },
    [hasSubmitted, isSubmitting, question.correctIndex, question.points, onAnswer, submitAnswer]
  );

  return (
    <div className="w-full max-w-lg mx-auto mt-2">
      <QuestionCardHeader
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        remaining={seconds}
        duration={question.durationSec}
      />

      <section className="mx-auto w-full max-w-lg px-4" aria-live="polite">
        {/* Question Content */}
        <div className="mx-auto mb-4 flex items-center justify-center w-full max-w-[306px] font-body font-normal text-[36px] leading-[0.92] text-center tracking-[-0.03em] text-white">
          {question.content}
        </div>

        {/* Media */}
        {question.mediaUrl && (
          <figure className="mx-auto mb-4 flex justify-center w-full">
            <div className="relative w-full max-w-[299px] h-[158px] rounded-[10px] overflow-hidden bg-[#17171a] border border-[#313136] shadow-[0_8px_0_#000]">
              <Image
                src={question.mediaUrl}
                alt={question.content}
                fill
                className="object-cover"
                sizes="299px"
              />
            </div>
          </figure>
        )}

        {/* Options */}
        <ul className="mx-auto mb-2 flex w-full flex-col gap-2">
          {question.options.map((opt, idx) => {
            const palette = PALETTES[idx % PALETTES.length];
            return (
              <QuestionOption
                key={idx}
                option={opt}
                index={idx}
                palette={palette}
                selectedOptionIndex={selectedIndex}
                onSelect={handleSelect}
                disabled={hasSubmitted || isSubmitting}
              />
            );
          })}
        </ul>

        {/* Status */}
        {hasSubmitted && (
          <div className="mx-auto text-center font-display text-[16px] text-[#99A0AE]">
            {isSubmitting ? "Submitting..." : "Answer submitted!"}
          </div>
        )}
      </section>
    </div>
  );
}

export default QuestionCard;
