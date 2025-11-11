"use client";
import * as React from "react";

import { submitAnswerAction } from "@/actions/game";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatMsToMMSS } from "@/lib/utils";
import { useUserPreferences } from "@/components/providers/userPreference";
import { useTimer } from "@/hooks/useTimer";
import { SoundOffIcon, SoundOnIcon } from "@/components/icons";
import Image from "next/image";
import { PALETTES } from "@/lib/constants";
import { PixelButton } from "@/components/buttons/PixelButton";
import { useRouter } from "next/navigation";
import { Prisma } from "@prisma/client";
import { useSound } from "@/hooks/useSound";

export type TimerState = "QUESTION_DURATION" | "EXTRA_TIME" | "FINISHED";

export default function LiveGameClient({
  gameInfo,
  userInfo,
}: {
  gameInfo: Prisma.GameGetPayload<{
    include: {
      config: true;
      questions: true;
      _count: { select: { answers: true } };
    };
  }>;
  userInfo: Prisma.UserGetPayload<{
    include: {
      _count: { select: { answers: true } };
    };
  }>;
}) {
  const router = useRouter();
  const { prefs, toggleSound } = useUserPreferences();
  const { signIn, getToken } = useAuth();
  const { playUrl, play, stopAll, stopUrl, stop } = useSound();
  const [, action, pending] = React.useActionState(submitAnswerAction, {
    error: "",
    success: false,
  });

  const [timerState, setTimerState] =
    React.useState<TimerState>("QUESTION_DURATION");
  const [selectedOption, setSelectedOption] = React.useState<string | null>(
    null
  );

  const totalQuestions = gameInfo?.questions.length ?? 0;
  const answeredCount = userInfo?._count.answers ?? 0;
  const currentQuestion = gameInfo?.questions[answeredCount];

  const questionTimeLimitMs =
    (gameInfo?.config?.questionTimeLimit ?? 10) * 1000;
  const extraTimeTimeMs = 3000;

  // Play question sound when question changes
  React.useEffect(() => {
    if (!currentQuestion) return;

    // Track what we're playing to clean up properly
    const soundUrl = currentQuestion.soundUrl;
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
  }, [
    currentQuestion?.id,
    currentQuestion?.soundUrl,
    playUrl,
    play,
    stopAll,
    stopUrl,
    stop,
  ]);

  // Redirect to score page when all questions are answered
  React.useEffect(() => {
    if (
      gameInfo &&
      userInfo &&
      totalQuestions > 0 &&
      answeredCount >= totalQuestions
    ) {
      router.push(`/game/${gameInfo.id}/score?fid=${userInfo.fid}`);
    }
  }, [gameInfo, userInfo, totalQuestions, answeredCount, router]);

  const questionTimer = useTimer({
    duration: questionTimeLimitMs,
    autoStart: true,
    onComplete: () => {
      setTimerState("EXTRA_TIME");
    },
  });

  const extraTimeTimer = useTimer({
    duration: extraTimeTimeMs,
    autoStart: timerState === "EXTRA_TIME",
    onComplete: () => {
      // Guard against accessing undefined currentQuestion
      if (!currentQuestion) {
        setTimerState("FINISHED");
        return;
      }

      React.startTransition(() => {
        const formData = new FormData();
        formData.append("fid", String(userInfo.fid));
        formData.append("gameId", String(gameInfo.id));
        formData.append("questionId", String(currentQuestion.id));
        // Use selectedOption if available, otherwise "noanswer"
        formData.append("selected", selectedOption || "noanswer");
        formData.append("timeTaken", String(questionTimer.elapsed / 1000));
        // Include auth token if available
        const token = getToken();
        if (token) {
          formData.append("authToken", token);
        }
        // submit answer
        action(formData);
      });
      setTimerState("FINISHED");
      router.refresh();
    },
  });

  const defaultFormattedTime = formatMsToMMSS(questionTimeLimitMs);

  // Authenticate proactively when game starts to avoid interrupting gameplay
  React.useEffect(() => {
    signIn().catch((error) => {
      console.error("Failed to authenticate:", error);
    });
  }, [signIn]);

  // Reset selected option and timer state when question changes
  React.useEffect(() => {
    if (currentQuestion) {
      setSelectedOption(null);
      setTimerState("QUESTION_DURATION");
    }
  }, [currentQuestion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const chosenIdx = React.useMemo(() => {
    if (!currentQuestion || !selectedOption) return null;
    return currentQuestion.options.indexOf(selectedOption);
  }, [selectedOption, currentQuestion?.options]); // eslint-disable-line react-hooks/exhaustive-deps

  // const handleSelectOption = (option: string) => {
  //   if (!gameInfo || !currentQuestion || timerState === "FINISHED") return;

  //   if (prefs.soundEnabled) SoundManager.play("click");

  //   setSelectedOption(option);

  //   const timeTakenSeconds = questionTimer.elapsed / 1000;

  //   const result = await submitAnswerAction({
  //     fid: userInfo.fid,
  //     gameId: gameInfo.id,
  //     questionId: currentQuestion.id,
  //     selected: option,
  //     timeTaken: timeTakenSeconds,
  //   });

  //   if (!result.success) {
  //     notify.error(result.error || "Submission failed");
  //   }
  // };

  const formattedTime = React.useMemo(() => {
    if (timerState === "QUESTION_DURATION") {
      return formatMsToMMSS(questionTimer.remaining);
    }
    if (timerState === "EXTRA_TIME") {
      return formatMsToMMSS(extraTimeTimer.remaining);
    }
    return formatMsToMMSS(0);
  }, [timerState, questionTimer.remaining, extraTimeTimer.remaining]);

  if (!currentQuestion) {
    return (
      <div className="w-full max-w-md sm:max-w-lg mx-auto mt-4 text-center">
        {answeredCount >= totalQuestions
          ? "Game complete! Redirecting..."
          : "Loading question..."}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto mt-4">
      {/* Question Header */}
      <div className="w-full flex items-center justify-between px-3 py-1 ">
        {/* Question Counter */}
        <span className="font-editundo text-white text-[18px] leading-none tracking-tight">
          {String(answeredCount).padStart(2, "0")}/
          {String(totalQuestions).padStart(2, "0")}
        </span>

        {/* Sound Toggle Button */}
        <button
          onClick={toggleSound}
          className=" bg-white/15 rounded-full p-2 backdrop-blur-sm active:scale-95 transition-transform mr-auto ml-3"
          aria-label={prefs.soundEnabled ? "Mute sound" : "Unmute sound"}
          type="button"
        >
          {prefs.soundEnabled ? (
            <SoundOnIcon className="w-4 h-4 text-white" />
          ) : (
            <SoundOffIcon className="w-4 h-4 text-white" />
          )}
        </button>

        {/* --- FIXED TIMER LOGIC --- */}
        {/* Show question timer (white) */}
        {timerState === "QUESTION_DURATION" && (
          <div className="flex items-center gap-2">
            <span className="font-pixel text-white text-lg">
              {formattedTime}
            </span>
          </div>
        )}

        {/* Show gap timer (red with clock) */}
        {timerState === "EXTRA_TIME" && (
          <div className="flex items-center gap-1">
            <Image
              src="/images/icons/clock.svg"
              width={30}
              height={30}
              alt="clock"
              className="w-[30px] h-[30px]" // Use fixed size for stability
            />
            <span className="font-pixel text-[#B93814] text-2xl">
              {formattedTime}
            </span>
          </div>
        )}

        {/* Fallback / Default (e.g., if state is null or TIMES_UP) */}
        {timerState !== "QUESTION_DURATION" && timerState !== "EXTRA_TIME" && (
          <span className="font-pixel text-white text-lg">
            {defaultFormattedTime}
          </span>
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
            {currentQuestion.imageUrl ? (
              <Image
                src={currentQuestion.imageUrl}
                alt={currentQuestion.text}
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
          {currentQuestion.options.map((opt, idx) => {
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
                    setSelectedOption(opt);
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
