// ───────────────────────── QuestionCardHeader.tsx ─────────────────────────
"use client";
import { SoundOffIcon, SoundOnIcon } from "@/components/icons";

import Image from "next/image";
import { formatMsToMMSS } from "@/lib/utils"; // Import helper
import { useUserPreferences } from "@/components/providers/userPreference";

// Define the states from QuestionView
type QuestionState = "SHOWING_ROUND_BREAK" | "SHOWING_QUESTION" | "SHOWING_GAP";

interface QuestionHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  questionTimeLimit: number; // In seconds
  state: QuestionState;
  formattedTime: string;
  percent: number; // A value from 0 to 1
}

export function QuestionHeader({
  currentQuestion,
  totalQuestions,
  questionTimeLimit, // in seconds
  state,
  formattedTime,
  percent,
}: QuestionHeaderProps) {
  const { prefs, toggleSound } = useUserPreferences();

  // Format the default time limit (e.g., "00:10")
  const defaultFormattedTime = formatMsToMMSS(questionTimeLimit * 1000);

  // Note: currentQuestion is the count of *answered* questions.
  // For display, we want to show the *current* question number (which is answered + 1)
  const displayQuestionNum = currentQuestion + 1;

  return (
    <div className="w-full flex items-center justify-between px-3 py-1 ">
      {/* Left: Question Index */}
      <span className="font-editundo text-white text-[18px] leading-none tracking-tight">
        {String(displayQuestionNum).padStart(2, "0")}/
        {String(totalQuestions).padStart(2, "0")}
      </span>
      {/* Center: Sound Button */}
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

      {/* TIMER MODES */}
      {state === "SHOWING_QUESTION" && (
        <div className="flex items-center gap-2">
          <span className="font-pixel text-white text-lg">{formattedTime}</span>
          <CapsuleProgress progress={percent} />
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

      {/* Fallback: Show the default time limit if not running */}
      {state !== "SHOWING_QUESTION" && state !== "SHOWING_GAP" && (
        <span className="font-pixel text-white text-lg">
          {defaultFormattedTime}
        </span>
      )}
    </div>
  );
}

export function CapsuleProgress({ progress }: { progress: number }) {
  return (
    <div className="relative w-[78px] h-[12px]">
      <svg
        width="78"
        height="12"
        viewBox="0 0 78 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      >
        {/* BACKGROUND (static) */}
        <path d="M4.65347 0.0181034C4.67876 0.0181034..." fill="#4A0B0B" />
        <path d="M5.07078 0.271509C5.09185 0.271509..." fill="#BE3C2B" />
        <path d="M5.91797 1.0453C5.93905 1.0453..." fill="#B55E2C" />
        <path d="M5.91797 1.0453C5.93905 1.0453..." fill="#E9DCCB" />
      </svg>

      {/* FOREGROUND (masked) */}
      <svg
        width="78"
        height="12"
        viewBox="0 0 78 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
        style={{
          clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
          transition: "clip-path 0.15s linear",
        }}
      >
        <path d="M4.65347 0.0181034C4.67876 0.0181034..." fill="#4A0B0B" />
        <path d="M5.07078 0.271509C5.09185 0.271509..." fill="#BE3C2B" />
        <path d="M5.91797 1.0453C5.93905 1.0453..." fill="#B55E2C" />
        <path d="M5.91797 1.0453C5.93905 1.0453..." fill="#E9DCCB" />
        <path d="M51.4162 0.990967..." fill="#F96F49" />
        <path d="M38.914 0.996029..." fill="#F96F49" />
        <path d="M52.9714 0.990967..." fill="#F96F49" />
        <path d="M18.0834 1.00079..." fill="#F96F49" />
        <path d="M34.7498 0.990967..." fill="#F96F49" />
        <path d="M5.89307 1.00079..." fill="#F96F49" />
        <path d="M24.861 0.996029..." fill="#F96F49" />
        <g style={{ mixBlendMode: "color-dodge", opacity: 0.8 }}>
          <path d="M7.36799 2.04066..." fill="#F73812" />
        </g>
        <g style={{ mixBlendMode: "color-dodge", opacity: 0.5 }}>
          <path d="M9.7453 2.82349..." fill="#FCC9A4" />
        </g>
      </svg>
    </div>
  );
}
