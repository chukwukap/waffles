"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PixelButton } from "@/components/buttons/PixelButton";
import { useGame } from "@/state";
import { useMiniUser } from "@/hooks/useMiniUser";
import { Clock } from "@/components/icons";
import { NEXT_QUESTION_DELAY_SECONDS } from "@/state/game/constants";

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
  // ── Context selectors
  const {
    game,
    questionIndex: currentQuestionIndex,
    selectedAnswer,
    selectAnswer,
    view: gameView,
    submitAnswer,
    loadQuestions,
    advanceToNextQuestion,
  } = useGame();
  const user = useMiniUser();
  // Define timers early so they are in scope for onPick deps
  const [questionTimer, setQuestionTimer] = React.useState(
    game?.config?.roundTimeLimit ?? 0
  );
  const [roundTimer, setRoundTimer] = React.useState(
    NEXT_QUESTION_DELAY_SECONDS
  );

  const onPick = React.useCallback(
    async (val: string) => {
      selectAnswer(val);
      const elapsed = (game?.config?.roundTimeLimit ?? 0) - questionTimer;
      const timeTaken = Math.max(0, elapsed);
      if (user.fid) {
        try {
          await submitAnswer({
            farcasterId: user.fid,
            selected: val,
            timeTaken,
          });
          setTimeout(() => {
            advanceToNextQuestion();
          }, NEXT_QUESTION_DELAY_SECONDS * 3000); // wait for the next question
        } catch (e) {
          console.error("submitAnswer failed", e);
        }
      }
    },
    [
      selectAnswer,
      submitAnswer,
      advanceToNextQuestion,
      user.fid,
      game?.config?.roundTimeLimit,
      questionTimer,
    ]
  );

  // ── HUD bits for the lower UI

  // Track [timer] that counts down from maxTime to 0 every second
  const maxTime = game?.config?.roundTimeLimit;
  if (!maxTime) throw new Error("Round time limit not set"); // safety

  // Two timers: one for question, one for "locked" state
  React.useEffect(() => {
    setQuestionTimer(maxTime);
    setRoundTimer(NEXT_QUESTION_DELAY_SECONDS);
  }, [maxTime]);

  // When question/answer state changes, reset timers accordingly
  React.useEffect(() => {
    if (gameView === "QUESTION_ACTIVE") {
      setQuestionTimer(maxTime);
    }
  }, [gameView, maxTime]);

  // Tick down appropriate timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (gameView === "QUESTION_ACTIVE") {
      interval = setInterval(() => {
        setQuestionTimer((t) => Math.max(0, t - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameView]);

  // Ensure questions are loaded if not present
  React.useEffect(() => {
    if (game?.id && (!game.questions || game.questions.length === 0)) {
      loadQuestions();
    }
  }, [game?.id, game?.questions, loadQuestions]);

  // Render the correct time and progress
  const time =
    gameView === "QUESTION_ACTIVE"
      ? Math.max(0, questionTimer)
      : Math.max(0, roundTimer);

  const progress = Math.max(
    0,
    Math.min(
      1,
      (gameView === "QUESTION_ACTIVE" ? questionTimer : roundTimer) / maxTime
    )
  );

  return (
    <section
      className="mx-auto w-full max-w-screen-sm px-4 pb-24 pt-6 animate-up"
      aria-live="polite"
    >
      {/* ───────── HUD (question counter + timer) ───────── */}
      <div className="mb-3 flex items-center justify-between text-white">
        <div className="font-body text-sm tracking-wide">
          {String(currentQuestionIndex + 1).padStart(2, "0")}/
          {String(game?.questions?.length ?? 0).padStart(2, "0")}
        </div>

        <div className="flex items-center gap-3">
          <div className="font-body text-sm tabular-nums">
            00:{String(time).padStart(2, "0")}
          </div>
          <div
            className="relative h-3 w-28 overflow-hidden rounded-full border border-black/40 bg-white/20"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={maxTime}
            aria-valuenow={
              gameView === "QUESTION_ACTIVE" ? questionTimer : roundTimer
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
      <h1 className="mb-5 text-center font-body text-4xl md:text-5xl">
        {game?.questions?.[currentQuestionIndex]?.text}
      </h1>

      {/* Question image (defines width for buttons as well) */}
      <figure
        className={cn("mx-auto mb-6 w-full flex justify-center", CONTENT_CAP)}
        style={{
          // Center and space for the responsive image box
          borderRadius: 10,
        }}
      >
        <div
          className="relative w-full"
          style={{
            aspectRatio: "299 / 158",
            borderRadius: 10,
            maxWidth: 480, // allow bigger size on larger screens
            minWidth: 200,
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.10)",
            flex: "none",
            order: 0,
            flexGrow: 0,
            overflow: "hidden",
          }}
        >
          <Image
            src={
              game?.questions?.[currentQuestionIndex]?.imageUrl ||
              "/images/avatars/a.png"
            }
            alt="Question image"
            fill
            className="object-cover w-full h-full"
            style={{
              borderRadius: 10,
            }}
            priority
            sizes="(max-width: 600px) 90vw, 299px"
          />
        </div>
      </figure>

      {/* Answers — EXACT same width as image via CONTENT_CAP */}
      <ul className={cn("mx-auto flex w-full flex-col gap-4", CONTENT_CAP)}>
        {game?.questions?.[currentQuestionIndex]?.options.map((opt, idx) => {
          const isChosen = selectedAnswer === opt;

          const palette = PALETTES[idx] ?? PALETTES[PALETTES.length - 1];
          const borderWidth = isChosen ? 6 : 4;

          // Determine scale and width: normal for unselected, bigger & full for chosen, shrunken & narrower for others
          let scale = 1,
            width = "100%";
          if (selectedAnswer != null) {
            if (isChosen) {
              scale = 1.08;
              width = "100%";
            } else {
              scale = 0.96;
              width = "50%";
            }
          }

          return (
            <li key={idx} className="min-w-0 flex justify-center">
              <PixelButton
                backgroundColor={palette.bg}
                borderColor={palette.border}
                textColor={palette.text}
                borderWidth={borderWidth}
                aria-pressed={isChosen}
                onClick={() => onPick(opt)}
                className={cn(
                  "rounded-xl px-4 py-3 text-base sm:px-6 sm:py-4 sm:text-lg",
                  "transition-transform transition-all duration-200"
                )}
                style={{
                  width,
                  transform: `scale(${scale})`,
                  zIndex: isChosen ? 2 : 1,
                }}
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
          gameView === "QUESTION_ACTIVE" ? "opacity-100" : "opacity-0"
        )}
        aria-live="polite"
      >
        Answer submitted! Wait for the next question…
      </div>
    </section>
  );
}
