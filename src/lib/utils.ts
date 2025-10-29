import { HydratedGame } from "@/state/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getWeekdayString(
  dayIdx: number,
  options?: {
    locale?: string;
    format?: "long" | "short" | "narrow";
    emphasizeToday?: boolean;
  }
): string {
  if (
    typeof dayIdx !== "number" ||
    !Number.isFinite(dayIdx) ||
    dayIdx < 0 ||
    dayIdx > 6
  ) {
    throw new RangeError(
      "dayIdx must be an integer between 0 (Sunday) and 6 (Saturday)"
    );
  }
  const {
    locale = "en-US",
    format = "long",
    emphasizeToday = true,
  } = options || {};
  const refSunday = new Date(Date.UTC(2023, 6, 2 + dayIdx));
  const weekdayStr = new Intl.DateTimeFormat(locale, {
    weekday: format,
  }).format(refSunday);

  const now = new Date();
  const todayIdx = now.getDay();
  if (emphasizeToday && dayIdx === todayIdx) {
    let todayWord = "";
    try {
      todayWord = new Intl.RelativeTimeFormat(locale, {
        numeric: "auto",
      }).format(0, "day");
    } catch {
      todayWord = "Today";
    }
    if (todayWord && todayWord.toLowerCase() !== weekdayStr.toLowerCase()) {
      return `${todayWord} (${weekdayStr})`;
    }
    return `Today (${weekdayStr})`;
  }

  return weekdayStr;
}

export function calculatePrizePool(game: HydratedGame) {
  return (
    game._count.tickets * (game.config?.ticketPrice ?? 0) +
    (game.config?.additionPrizePool ?? 0)
  );
}
/**
 * Check if a question number is a snapshot of the total number of questions for a round.
 * @param x - The current question number.
 * @param totalQuestions - The total number of questions.
 * @returns True if x is a snapshot of totalQuestions, false otherwise.
 */
export function isSnapshot(x: number, totalQuestions: number): boolean {
  const step = Math.floor(totalQuestions / 3);
  return x === step || x === step * 2 || x === totalQuestions;
}
