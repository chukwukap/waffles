import { formatTimeColon } from "@/lib/utils";
import { TimerTube } from "./TimerTube";

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
    <div className="w-full flex items-center justify-between px-3 py-2">
      {/* Question Counter */}
      <span className="font-body text-white text-[18px] leading-none tracking-tight">
        {String(questionNumber).padStart(2, "0")}/
        {String(totalQuestions).padStart(2, "0")}
      </span>

      {/* Timer - countdown display */}
      <div className="flex items-center gap-2">
        <span className="font-body text-white text-[18px]">
          {formatTimeColon(remaining)}
        </span>
        <TimerTube remaining={remaining} duration={duration} />
      </div>
    </div>
  );
}
