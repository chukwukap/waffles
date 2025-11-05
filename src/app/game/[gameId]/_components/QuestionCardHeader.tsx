"use client";
import { SoundOffIcon, SoundOnIcon } from "@/components/icons";

import Image from "next/image";
import { formatMsToMMSS } from "@/lib/utils";
import { useUserPreferences } from "@/components/providers/userPreference";

// Define state constants for clarity, matching the original code's intent
const QUESTION_STATE = "SHOWING_QUESTION";
const GAP_STATE = "SHOWING_GAP";

interface QuestionHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  questionTimeLimit: number;
  formattedTime: string;
  state: typeof QUESTION_STATE | typeof GAP_STATE | null; // <-- ADDED STATE PROP
}

export function QuestionHeader({
  currentQuestion,
  totalQuestions,
  questionTimeLimit,
  formattedTime,
  state, // <-- ADDED STATE PROP
}: QuestionHeaderProps) {
  const { prefs, toggleSound } = useUserPreferences();

  const defaultFormattedTime = formatMsToMMSS(questionTimeLimit * 1000);
  const displayQuestionNum = currentQuestion + 1;

  return (
    <div className="w-full flex items-center justify-between px-3 py-1 ">
      {/* Question Counter */}
      <span className="font-editundo text-white text-[18px] leading-none tracking-tight">
        {String(displayQuestionNum).padStart(2, "0")}/
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
      {state === QUESTION_STATE && (
        <div className="flex items-center gap-2">
          <span className="font-pixel text-white text-lg">{formattedTime}</span>
        </div>
      )}

      {/* Show gap timer (red with clock) */}
      {state === GAP_STATE && (
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
      {state !== QUESTION_STATE && state !== GAP_STATE && (
        <span className="font-pixel text-white text-lg">
          {defaultFormattedTime}
        </span>
      )}
      {/* --- END FIXED TIMER LOGIC --- */}
    </div>
  );
}
