"use client";
import { SoundOffIcon, SoundOnIcon } from "@/components/icons";

import Image from "next/image";
import { formatMsToMMSS } from "@/lib/utils";
import { useUserPreferences } from "@/components/providers/userPreference";

type QuestionState = "SHOWING_ROUND_BREAK" | "SHOWING_QUESTION" | "SHOWING_GAP";

interface QuestionHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  questionTimeLimit: number;
  state: QuestionState;
  formattedTime: string;
}

export function QuestionHeader({
  currentQuestion,
  totalQuestions,
  questionTimeLimit,
  state,
  formattedTime,
}: QuestionHeaderProps) {
  const { prefs, toggleSound } = useUserPreferences();

  const defaultFormattedTime = formatMsToMMSS(questionTimeLimit * 1000);

  const displayQuestionNum = currentQuestion + 1;

  return (
    <div className="w-full flex items-center justify-between px-3 py-1 ">
      <span className="font-editundo text-white text-[18px] leading-none tracking-tight">
        {String(displayQuestionNum).padStart(2, "0")}/
        {String(totalQuestions).padStart(2, "0")}
      </span>
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

      {state === "SHOWING_QUESTION" && (
        <div className="flex items-center gap-2">
          <span className=" text-white text-lg">{formattedTime}</span>
        </div>
      )}
      {state === "SHOWING_GAP" && (
        <div className="flex items-center gap-1">
          <Image
            src="/images/icons/clock.svg"
            width={30}
            height={30}
            alt="clock"
            className="w-full h-full"
          />
          <span className="font-pixel text-[#B93814] text-2xl">
            {formattedTime}
          </span>
        </div>
      )}

      {state !== "SHOWING_QUESTION" && state !== "SHOWING_GAP" && (
        <span className="font-pixel text-white text-lg">
          {defaultFormattedTime}
        </span>
      )}
    </div>
  );
}
