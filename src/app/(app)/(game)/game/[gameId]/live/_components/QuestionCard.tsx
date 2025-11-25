"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PALETTES } from "@/lib/constants";

import { useCountdown } from "@/hooks/useCountdown";
import { useSound } from "@/components/providers/SoundContext";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAuth } from "@/hooks/useAuth";
import { submitAnswerAction } from "@/actions/game";
import { QuestionCardHeader } from "./QuestionCardHeader";
import { QuestionOption } from "./QuestionOption";
import type { LiveGameInfoPayload } from "../page"; // Import the payload type

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
  const { context } = useMiniKit();
  const { getToken, signIn } = useAuth();
  const [selectedOptionIndex, setSelectedOptionIndex] = React.useState<
    number | null
  >(null);

  const { playSound } = useSound();
  const [submissionState, submitAnswerAct, pending] = React.useActionState(
    submitAnswerAction,
    {
      error: "",
      success: false,
    }
  );

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

  // Helper to submit answer
  const submitAnswer = React.useCallback(
    async (index: number | null, timeTakenMs: number) => {
      if (!context) {
        console.error("context is not available");
        return;
      }

      let authToken = getToken();

      if (!authToken) {
        authToken = await signIn();
        if (!authToken) {
          console.error("Authentication required to submit answer");
          return;
        }
      }

      const formData = new FormData();
      formData.append("fid", String(context.user?.fid));
      formData.append("gameId", String(question.gameId));
      formData.append("questionId", String(question.id));
      formData.append("timeTakenMs", String(timeTakenMs));
      formData.append("authToken", authToken);

      if (index !== null) {
        formData.append("selectedIndex", String(index));
      }

      React.startTransition(() => {
        submitAnswerAct(formData);
      });
    },
    [context, getToken, signIn, question.gameId, question.id, submitAnswerAct]
  );

  // Handler for user selecting an option
  const handleSelect = (index: number) => {
    if (hasSubmitted || pending) return;

    // 1. Update UI immediately
    setSelectedOptionIndex(index);
    setHasSubmitted(true);

    // 2. Calculate precise time taken
    const now = Date.now();
    const timeTakenMs = Math.min(now - startTimeRef.current, duration * 1000);

    // 3. Submit immediately (Security: prevents looking up answer then submitting)
    submitAnswer(index, timeTakenMs);
  };

  // Handler for timer completion
  const handleTimerComplete = async () => {
    // If timer runs out and we haven't submitted, submit a "timeout" (no answer)
    if (!hasSubmitted) {
      setHasSubmitted(true);
      // Time taken is full duration
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

  // ───────────────────────── PLAY SOUND ON QUESTION CHANGE ─────────────────────────
  React.useEffect(() => {
    // Use the new soundUrl field
    if (!question || !question.soundUrl) return;

    playSound(question.soundUrl, { volume: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSound, question.id]);

  // start the countdown when the component mounts
  React.useEffect(() => {
    reset();
    start();
    // Reset start time again just in case reset() takes time
    startTimeRef.current = Date.now();
  }, [reset, start, question.id]);

  // ───────────────────────── UI ─────────────────────────
  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto mt-2">
      <QuestionCardHeader
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        remaining={remaining}
        duration={duration - 3} // Keep old duration logic for header
      />

      {/* Question Card Content */}
      <section
        className="mx-auto w-full max-w-screen-sm px-4  animate-up"
        aria-live="polite"
      >
        {/* Game Title - Use new `content` field */}
        <div
          className="
          mx-auto
          mb-4
          flex
          items-center
          justify-center
          select-none
          w-full
          max-w-[206px]
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
          {question.content}
        </div>

        {/* Image Section - Use new `mediaUrl` field and check if it exists */}
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

        {/* Options */}
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
                disabled={pending || hasSubmitted}
              />
            );
          })}
        </ul>

        {/* Submitted Footer */}
        {selectedOptionIndex !== null && (
          <div
            className={cn(
              "mx-auto text-center font-display font-medium text-[16px] leading-[130%] tracking-[-0.03em] text-[#99A0AE] transition-opacity",
              "opacity-100"
            )}
            aria-live="polite"
          >
            {pending
              ? "Submitting..."
              : "Answer selected! Waiting for time to run out..."}
          </div>
        )}
      </section>
    </div>
  );
}

export default QuestionCard;
