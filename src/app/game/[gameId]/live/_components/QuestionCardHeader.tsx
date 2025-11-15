import { formatTimeColon } from "@/lib/utils";

import Image from "next/image";
import { TimerTube } from "./TimerTube";
import { SoundToggle } from "./SoundToggle";

export function QuestionCardHeader({
  questionNumber,
  totalQuestions,
  remaining,
  duration,
}: {
  questionNumber: number;
  totalQuestions: number;
  remaining: number;
  duration: number;
}) {
  return (
    <div className="w-full flex items-center justify-between px-3 py-2 ">
      {/* Question Counter */}
      <span className="font-body text-white text-[18px] leading-none tracking-tight">
        {String(questionNumber).padStart(2, "0")}/
        {String(totalQuestions).padStart(2, "0")}
      </span>

      <SoundToggle />

      {/* Timer Logic */}
      {remaining > 3 ? (
        <div className="flex items-center">
          <span className="text-white text-[18px] mr-2">
            {formatTimeColon(duration)}
          </span>
          <TimerTube remaining={remaining} duration={duration} />
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Image
            src="/images/icons/clock.png"
            width={30}
            height={30}
            priority={true}
            alt="clock"
            className="w-[30px] h-[30px]"
          />
          <span className="text-[#B93814] text-2xl">
            {formatTimeColon(remaining)}
          </span>
        </div>
      )}
    </div>
  );
}
