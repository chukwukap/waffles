import { SoundOffIcon, SoundOnIcon } from "@/components/icons";
import { formatTimeColon } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";
import Image from "next/image";

export function QuestionCardHeader({
  questionNumber,
  totalQuestions,

  remaining,
}: {
  questionNumber: number;
  totalQuestions: number;
  remaining: number;
}) {
  const { soundEnabled, toggleSound } = useSound();
  return (
    <div className="w-full flex items-center justify-between px-3 py-2 ">
      {/* Question Counter */}
      <span className="font-body text-white text-[18px] leading-none tracking-tight">
        {String(questionNumber).padStart(2, "0")}/
        {String(totalQuestions).padStart(2, "0")}
      </span>

      {/* Sound Toggle Button */}
      <button
        onClick={toggleSound}
        aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
        type="button"
        className="
          mr-auto ml-3 flex items-center justify-center
          w-[34px] h-[34px]
          gap-2
          rounded-full
          p-2
          bg-white/10
          backdrop-blur-sm
          transition-transform
          active:scale-95
        "
        style={{
          borderImage:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 100%) 1",
        }}
      >
        {soundEnabled ? (
          <SoundOffIcon className="w-4 h-4 text-white" />
        ) : (
          <SoundOnIcon className="w-4 h-4 text-white" />
        )}
      </button>

      {/* Timer Logic */}
      {remaining > 3 ? (
        <div className="flex items-center gap-2">
          <span className="text-white text-lg">
            {formatTimeColon(remaining)}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Image
            src="/images/icons/clock.svg"
            width={30}
            height={30}
            priority={true}
            alt="clock"
            className="w-[30px] h-[30px]"
          />
          <span className="font-pixel text-[#B93814] text-2xl">
            {formatTimeColon(remaining)}
          </span>
        </div>
      )}
    </div>
  );
}
