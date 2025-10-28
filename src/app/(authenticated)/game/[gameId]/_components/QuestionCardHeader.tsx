"use client";

import { useCallback, useMemo } from "react";
import { SoundOffIcon, SoundOnIcon } from "@/components/icons";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import Image from "next/image";
import { UseTimerResult } from "@/hooks/useTimer";

interface QuestionHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  questionTimer: UseTimerResult;
  questionGapTimer: UseTimerResult;
  questionTimeLimit: number;
}

export function QuestionHeader({
  currentQuestion,
  totalQuestions,
  questionTimer,
  questionGapTimer,
  questionTimeLimit,
}: QuestionHeaderProps) {
  const { prefs, toggleSound } = useUserPreferences();
  const { soundEnabled } = prefs;

  return (
    <div className="w-full flex items-center justify-between px-3 py-2 ">
      {/* Left: Question Index */}
      <span className="font-editundo text-white text-[18px] leading-none tracking-tight">
        {String(currentQuestion).padStart(2, "0")}/
        {String(totalQuestions).padStart(2, "0")}
      </span>

      {/* Center: Sound Button (floating above content) */}
      <button
        onClick={toggleSound}
        className=" bg-white/15 rounded-full p-2 backdrop-blur-sm active:scale-95 transition-transform mr-auto ml-3"
        aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
        type="button"
      >
        {soundEnabled ? (
          <SoundOnIcon className="w-4 h-4 text-white" />
        ) : (
          <SoundOffIcon className="w-4 h-4 text-white" />
        )}
      </button>

      {/* TIMER MODES */}
      {questionTimer.isRunning && (
        <div className="flex items-center gap-2">
          <span className="font-pixel text-white text-lg">
            {questionTimer.formatted}
          </span>
          <CapsuleProgress progress={questionTimer.percent} />
        </div>
      )}

      {questionGapTimer.isRunning && (
        <div className="flex items-center gap-1">
          <Image
            src="/images/icons/clock.svg"
            width={30}
            height={30}
            alt="clock"
            className="w-full h-full"
          />
          <span className="font-pixel text-[#B93814] text-2xl">
            {questionGapTimer.formatted}
          </span>
        </div>
      )}

      {!questionTimer.isRunning && !questionGapTimer.isRunning && (
        <span className="font-pixel text-white text-lg">
          00:{questionTimeLimit}
        </span>
      )}
    </div>
  );
}

export function CapsuleProgress({ progress }: { progress: number }) {
  return (
    <div className="relative h-[12px] w-[78px]">
      {/* capsule background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/icons/capsule.svg"
        alt="capsule"
        className="absolute inset-0 w-full h-full"
      />

      {/* clipping mask for remaining time */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/icons/capsule.svg"
          alt="capsule"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
