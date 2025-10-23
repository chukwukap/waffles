"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PixelButton } from "@/components/buttons/PixelButton";
import { useGameStore } from "@/stores/gameStore";

/** Shared cap so the image and buttons are exactly the same width */
const CONTENT_CAP = "max-w-[560px]";

/** Answer row palettes (gold, purple, blue, green) */
const PALETTES = [
  { bg: "#FFE8BA", border: "#FFC931", text: "#151515" },
  { bg: "#EFD6FF", border: "#B45CFF", text: "#151515" },
  { bg: "#D7EBFF", border: "#2E7DFF", text: "#151515" },
  { bg: "#D8FFF1", border: "#18DCA5", text: "#151515" },
] as const;

export default function QuestionView() {
  // ── Store selectors
  const game = useGameStore((s) => s.game);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const selectedAnswer = useGameStore((s) => s.selectedAnswer);
  const selectAnswer = useGameStore((s) => s.selectAnswer);
  const gameState = useGameStore((s) => s.gameState);

  const locked = gameState !== "QUESTION_ACTIVE";
  const onPick = React.useCallback(
    (val: string) => {
      if (!locked) selectAnswer(val);
    },
    [locked, selectAnswer]
  );

  // ── HUD bits for the lower UI

  // Track [timer] that counts down from maxTime to 0 every second
  const maxTime = game?.config?.roundTimeLimit;
  if (!maxTime) throw new Error("Round time limit not set"); // safety

  // Two timers: one for question, one for "locked" state
  const [questionTimer, setQuestionTimer] = React.useState(maxTime);
  const [roundTimer, setRoundTimer] = React.useState(maxTime);

  // When question/answer state changes, reset timers accordingly
  React.useEffect(() => {
    if (gameState === "QUESTION_ACTIVE") {
      setQuestionTimer(maxTime);
    } else if (gameState === "ANSWER_SUBMITTED") {
      setRoundTimer(maxTime);
    }
  }, [gameState, maxTime]);

  // Tick down appropriate timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (gameState === "QUESTION_ACTIVE") {
      interval = setInterval(() => {
        setQuestionTimer((t) => Math.max(0, t - 1));
      }, 1000);
    } else if (gameState === "ANSWER_SUBMITTED") {
      interval = setInterval(() => {
        setRoundTimer((t) => Math.max(0, t - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState]);

  // Render the correct time and progress
  const time =
    gameState === "QUESTION_ACTIVE"
      ? Math.max(0, questionTimer)
      : Math.max(0, roundTimer);

  const progress = Math.max(
    0,
    Math.min(
      1,
      (gameState === "QUESTION_ACTIVE" ? questionTimer : roundTimer) / maxTime
    )
  );

  return (
    <section
      className="mx-auto w-full max-w-screen-sm px-4 pb-24 pt-6 animate-up"
      aria-live="polite"
    >
      {/* ───────── HUD (question counter + timer) ───────── */}
      <div className="mb-3 flex items-center justify-between text-white">
        <div className="font-[family-name:var(--font-display)] text-sm tracking-wide">
          {String(currentQuestionIndex + 1).padStart(2, "0")}/
          {String(game?.questions?.length ?? 0).padStart(2, "0")}
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
            aria-valuenow={
              gameState === "QUESTION_ACTIVE" ? questionTimer : roundTimer
            }
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
        {game?.questions?.[currentQuestionIndex]?.text}
      </h1>

      {/* Question image (defines width for buttons as well) */}
      <figure
        className={cn(
          "mx-auto mb-6 w-full overflow-hidden rounded-[18px] border border-white/10 bg-black/30",
          CONTENT_CAP
        )}
      >
        <Image
          // src={game?.questions?.[currentQuestionIndex]?.imageUrl}
          src="/images/avatars/a.png"
          alt="Question image"
          width={1120}
          height={1120}
          className="h-auto w-full object-cover"
          priority
        />
      </figure>

      {/* Answers — EXACT same width as image via CONTENT_CAP */}
      <ul className={cn("mx-auto flex w-full flex-col gap-4", CONTENT_CAP)}>
        {game?.questions?.[currentQuestionIndex]?.options.map((opt, idx) => {
          const isChosen = selectedAnswer === opt;
          const isCorrect =
            locked &&
            opt === game?.questions?.[currentQuestionIndex]?.correctAnswer;

          const palette = PALETTES[idx] ?? PALETTES[PALETTES.length - 1];
          const borderWidth = isChosen ? 6 : 4;

          return (
            <li key={idx} className="min-w-0">
              <PixelButton
                backgroundColor={palette.bg}
                borderColor={palette.border}
                textColor={palette.text}
                borderWidth={borderWidth}
                disabled={locked}
                aria-pressed={isChosen}
                onClick={() => onPick(opt)}
                className={cn(
                  "w-full rounded-xl px-4 py-3 text-base sm:px-6 sm:py-4 sm:text-lg",
                  isChosen && "disabled:opacity-100",
                  isCorrect && "ring-2 ring-[--color-success]",
                  isChosen && !isCorrect && "ring-2 ring-[--color-waffle-gold]"
                )}
              >
                <span className="truncate">{opt}</span>
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
