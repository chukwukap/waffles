"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PALETTES } from "@/lib/constants";

import { useCountdown } from "@/hooks/useCountdown";
import { Question } from "@prisma/client";
import { useSound } from "@/components/providers/SoundContext";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAuth } from "@/hooks/useAuth";
import { submitAnswerAction } from "@/actions/game";
import { QuestionCardHeader } from "./QuestionCardHeader";
import { QuestionOption } from "./QuestionOption";

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
  const [, submitAnswerAct, pending] = React.useActionState(
    submitAnswerAction,
    {
      error: "",
      success: false,
    }
  );

  const { remaining, start, reset } = useCountdown(
    duration,
    async () => {
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

      // submit answer to the server
      const formData = new FormData();

      formData.append("fid", String(context.user?.fid));

      formData.append("gameId", String(question.gameId));

      formData.append("questionId", String(question.id));

      formData.append("timeTaken", String(remaining));

      formData.append("authToken", authToken);

      const selected =
        selectedOptionIndex !== null
          ? question?.options[selectedOptionIndex]
          : null;

      if (selected !== null) {
        formData.append("selected", selected ?? "");
      }
      // Submit the answer
      React.startTransition(() => {
        submitAnswerAct(formData);
      });
      setSelectedOptionIndex(null);
      onComplete();
    },
    false
  );

  // ───────────────────────── PLAY SOUND ON QUESTION CHANGE ─────────────────────────
  React.useEffect(() => {
    if (!question || !question.soundUrl) return;

    playSound(question.soundUrl, { volume: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSound, question.id]);

  // start the countdown when the component mounts
  React.useEffect(() => {
    reset();
    start();
  }, [reset, start, question.id]);

  // ───────────────────────── UI ─────────────────────────
  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto mt-2">
      <QuestionCardHeader
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        remaining={remaining}
        duration={duration - 3}
      />

      {/* Question Card Content */}
      <section
        className="mx-auto w-full max-w-screen-sm px-4  animate-up"
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
          {question.text}
        </div>

        {/* Image Section */}
        <figure className="mx-auto mb-4 flex justify-center">
          <div className="relative w-[299px] h-[158px] rounded-[10px] overflow-hidden bg-[#17171a] border border-[#313136] shadow-[0_8px_0_#000]">
            <Image
              src={question.imageUrl}
              alt={question.text}
              fill
              className="object-cover w-full h-full rounded-[10px]"
              sizes="299px"
            />
          </div>
        </figure>

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
                onSelect={setSelectedOptionIndex}
                disabled={pending}
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
