import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function calculatePrizePool({
  ticketsNum,
  ticketPrice,
  additionPrizePool,
}: {
  ticketsNum: number;
  ticketPrice: number;
  additionPrizePool: number;
}) {
  return ticketsNum * ticketPrice + additionPrizePool;
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

/**
 * Formats milliseconds into a MM:SS string (0-padded).
 */
export function formatMsToMMSS(ms: number): string {
  if (!isFinite(ms) || ms < 0) ms = 0;
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return (
    String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0")
  );
}
