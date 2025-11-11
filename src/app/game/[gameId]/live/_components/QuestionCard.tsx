"use client";
import * as React from "react";
import { cn, formatMsToMMSS } from "@/lib/utils";
import Image from "next/image";
import { PALETTES } from "@/lib/constants";
import { PixelButton } from "@/components/buttons/PixelButton";
import { SoundOnIcon, SoundOffIcon } from "@/components/icons";
import { useCountdown } from "@/hooks/useCountdown";
import { Question } from "@prisma/client";
import { useSound } from "@/hooks/useSound";
import { Phase } from "../client";

/**
 * Presentational card for displaying a question, image, options, and timer.
 */
export function QuestionCard({
  question,
  phase,
  pending,
  totalQuestions,
  questionNumber,
  duration,
  onComplete,
  selectedAnswerIndex,
  onAnswerSelect,
}: {
  question: Question;
  phase: Phase;
  pending: boolean;
  totalQuestions: number;
  questionNumber: number;
  duration: number;
  onComplete: () => void;
  selectedAnswerIndex?: number | null;
  onAnswerSelect?: (index: number | null) => void;
}) {
  const { playUrl, play, stopAll, stopUrl, stop } = useSound();
  // Use controlled prop if provided, otherwise use internal state
  const [internalChosenIdx, setInternalChosenIdx] = React.useState<
    number | null
  >(null);
  const chosenIdx =
    selectedAnswerIndex !== undefined ? selectedAnswerIndex : internalChosenIdx;

  const handleAnswerSelect = (index: number) => {
    if (onAnswerSelect) {
      onAnswerSelect(index);
    } else {
      setInternalChosenIdx(index);
    }
  };

  const t = useCountdown(duration, onComplete);
  // Play question sound when question changes
  React.useEffect(() => {
    if (!question) return;

    // Track what we're playing to clean up properly
    const soundUrl = question.soundUrl;
    const hasSoundUrl = !!soundUrl;

    // Stop all sounds first to prevent overlap
    stopAll();

    // Small delay to ensure previous sounds are stopped
    const timeoutId = setTimeout(() => {
      if (hasSoundUrl) {
        playUrl(soundUrl, { loop: true, volume: 1 });
      } else {
        play("questionStart", { volume: 0.5 });
      }
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      // Stop only the specific sound we played
      if (hasSoundUrl && soundUrl) {
        stopUrl(soundUrl);
      } else {
        stop("questionStart");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id, question?.soundUrl, playUrl, play, stopAll, stopUrl, stop]);

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto mt-4">
      {/* Question Header */}
      <div className="w-full flex items-center justify-between px-3 py-1 ">
        {/* Question Counter */}
        <span className="font-editundo text-white text-[18px] leading-none tracking-tight">
          {String(questionNumber).padStart(2, "0")}/
          {String(totalQuestions).padStart(2, "0")}
        </span>

        {/* Sound Toggle Button */}
        <button
          onClick={() => {}}
          className=" bg-white/15 rounded-full p-2 backdrop-blur-sm active:scale-95 transition-transform mr-auto ml-3"
          aria-label={false ? "Mute sound" : "Unmute sound"}
          type="button"
        >
          {false ? (
            <SoundOnIcon className="w-4 h-4 text-white" />
          ) : (
            <SoundOffIcon className="w-4 h-4 text-white" />
          )}
        </button>

        {/* --- FIXED TIMER LOGIC --- */}
        {/* Show question timer (white) */}
        {phase === "question" && (
          <div className="flex items-center gap-2">
            <span className="font-pixel text-white text-lg">
              {formatMsToMMSS(t * 1000)}
            </span>
          </div>
        )}

        {/* Show gap timer (red with clock) */}
        {phase === "extra" && (
          <div className="flex items-center gap-1">
            <Image
              src="/images/icons/clock.svg"
              width={30}
              height={30}
              priority={true}
              alt="clock"
              className="w-[30px] h-[30px]" // Use fixed size for stability
            />
            <span className="font-pixel text-[#B93814] text-2xl">
              {formatMsToMMSS(t * 1000)}
            </span>
          </div>
        )}
      </div>
      {/* Question Card */}

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
            const palette = PALETTES[idx % PALETTES.length];
            const isChosen = chosenIdx === idx;

            return (
              <li
                key={idx}
                className={cn(
                  "min-w-0 flex justify-center transition-all duration-200 ease-out",
                  isChosen && "scale-105 z-10", // Scale up if chosen
                  !isChosen && "scale-90 opacity-50" // Scale down and dim if not chosen
                )}
              >
                <PixelButton
                  aria-pressed={isChosen}
                  tabIndex={-1}
                  backgroundColor={palette.bg}
                  textColor={palette.text}
                  borderColor={palette.border}
                  onClick={() => {
                    handleAnswerSelect(idx);
                  }}
                  // Disable all buttons while a submission is in progress
                  disabled={pending}
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
