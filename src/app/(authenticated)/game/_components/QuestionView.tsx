"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PixelButton } from "@/components/buttons/PixelButton";
import { useGameStore, type AnswerOption } from "@/stores/gameStore";

/** Shared cap so the image and buttons are exactly the same width */
const CONTENT_CAP = "max-w-[560px]";

/** Answer row palettes (gold, purple, blue, green) */
const PALETTES = [
  { bg: "#FFE8BA", border: "#FFC931", text: "#151515" },
  { bg: "#EFD6FF", border: "#B45CFF", text: "#151515" },
  { bg: "#D7EBFF", border: "#2E7DFF", text: "#151515" },
  { bg: "#D8FFF1", border: "#18DCA5", text: "#151515" },
] as const;

/** Keyboard shortcuts: 1..9 choose option (disabled when locked) */
function useOptionHotkeys(
  options: AnswerOption[] | undefined,
  onPick: (id: string) => void,
  locked: boolean
) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (locked || !options?.length) return;
      const n = Number(e.key);
      if (!Number.isNaN(n) && n >= 1 && n <= options.length) {
        onPick(options[n - 1].id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, onPick, locked]);
}

export default function QuestionView() {
  // ── Store selectors
  const currentQuestion = useGameStore((s) => s.currentQuestion);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const totalQuestions = useGameStore((s) => s.totalQuestions);
  const questionTimer = useGameStore((s) => s.questionTimer);
  const selectedAnswer = useGameStore((s) => s.selectedAnswer);
  const selectAnswer = useGameStore((s) => s.selectAnswer);
  const gameState = useGameStore((s) => s.gameState);
  const roundTimer = useGameStore((s) => s.roundTimer);

  const locked = gameState !== "QUESTION_ACTIVE";
  const onPick = React.useCallback(
    (id: string) => {
      if (!locked) selectAnswer(id);
    },
    [locked, selectAnswer]
  );

  // Hotkeys must be unconditional
  useOptionHotkeys(currentQuestion?.options, onPick, locked);

  if (!currentQuestion) return null;

  // ── HUD bits for the lower UI
  const maxTime = 10; // store uses 10s per question
  const time =
    gameState === "QUESTION_ACTIVE"
      ? Math.max(0, questionTimer)
      : Math.max(0, roundTimer);
  const progress = Math.max(
    0,
    Math.min(1, (gameState === "QUESTION_ACTIVE" ? questionTimer : 0) / maxTime)
  );

  return (
    <section
      className="mx-auto w-full max-w-screen-sm px-4 pb-24 pt-6 animate-up"
      aria-live="polite"
    >
      {/* ───────── HUD (from your lower code) ───────── */}
      <div className="mb-3 flex items-center justify-between text-white">
        <div className="font-[family-name:var(--font-display)] text-sm tracking-wide">
          {String(currentQuestionIndex + 1).padStart(2, "0")}/
          {String(totalQuestions).padStart(2, "0")}
        </div>

        <div className="flex items-center gap-3">
          <div className="font-[family-name:var(--font-display)] text-sm tabular-nums">
            00:{String(time).padStart(2, "0")}
          </div>
          <div
            className="relative h-3 w-28 overflow-hidden rounded-full border border-black/40 bg-white/20"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={maxTime}
            aria-valuenow={gameState === "QUESTION_ACTIVE" ? questionTimer : 0}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${progress * 100}%`,
                background: "linear-gradient(90deg,#FF7A3D 0%,#FFB36B 100%)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Question text */}
      <h1 className="mb-5 text-center font-[family-name:var(--font-display)] text-4xl md:text-5xl">
        {currentQuestion.questionText}
      </h1>

      {/* Question image (defines width for buttons as well) */}
      <figure
        className={cn(
          "mx-auto mb-6 w-full overflow-hidden rounded-[18px] border border-white/10 bg-black/30",
          CONTENT_CAP
        )}
      >
        <Image
          src={currentQuestion.imageUrl}
          alt="Question image"
          width={1120}
          height={1120}
          className="h-auto w-full object-cover"
          priority
        />
      </figure>

      {/* Answers — EXACT same width as image via CONTENT_CAP */}
      <ul className={cn("mx-auto flex w-full flex-col gap-4", CONTENT_CAP)}>
        {currentQuestion.options.map((opt, idx) => {
          const isChosen = selectedAnswer === opt.id;
          const isCorrect =
            locked && opt.id === currentQuestion.correctAnswerId;

          const palette = PALETTES[idx] ?? PALETTES[PALETTES.length - 1];

          // Visual states:
          // - Before selection: enabled, normal thickness (4px)
          // - After selection: all disabled; chosen keeps full opacity + thicker pixel frame (6px)
          const borderWidth = isChosen ? 6 : 4;

          return (
            <li key={opt.id} className="min-w-0">
              <PixelButton
                backgroundColor={palette.bg}
                borderColor={palette.border}
                textColor={palette.text}
                borderWidth={borderWidth}
                disabled={locked}
                aria-pressed={isChosen}
                onClick={() => onPick(opt.id)}
                className={cn(
                  "w-full rounded-xl px-4 py-3 text-base sm:px-6 sm:py-4 sm:text-lg",
                  // chosen remains vivid even when disabled
                  isChosen && "disabled:opacity-100",
                  // optional correctness rings (no layout shift)
                  isCorrect && "ring-2 ring-[--color-success]",
                  isChosen && !isCorrect && "ring-2 ring-[--color-waffle-gold]"
                )}
              >
                <span className="truncate">{opt.text}</span>
              </PixelButton>
            </li>
          );
        })}
      </ul>

      {/* Submitted message */}
      <div
        className={cn(
          "mx-auto mt-6 text-center text-sm text-muted transition-opacity md:text-base",
          CONTENT_CAP,
          gameState === "ANSWER_SUBMITTED" ? "opacity-100" : "opacity-0"
        )}
        aria-live="polite"
      >
        Answer submitted! Wait for the next question…
      </div>
    </section>
  );
}
