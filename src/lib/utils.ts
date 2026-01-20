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

export function formatTime(remainingSeconds: number): string {
  const seconds = Math.max(0, remainingSeconds);
  const minutes = Math.floor(seconds / 60);
  const secondsPart = Math.floor(seconds % 60);
  const paddedSeconds = String(secondsPart).padStart(2, "0");
  return `${minutes}M ${paddedSeconds}S`;
}

/**
 * Formats remaining seconds into "MM:SS" string.
 * @param remainingSeconds Total remaining seconds.
 * @returns A string formatted as "MM:SS"
 */
export function formatTimeColon(remainingSeconds: number): string {
  // Ensure we're working with a non-negative number
  const seconds = Math.max(0, remainingSeconds);

  // Calculate minutes and the remaining seconds
  const minutes = Math.floor(seconds / 60);
  const secondsPart = Math.floor(seconds % 60);

  // Pad both parts to always be two digits
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(secondsPart).padStart(2, "0");

  // Return the final formatted string
  return `${paddedMinutes}:${paddedSeconds}`;
}

// --- Invite Code Generation ---
const CODE_LENGTH = 6;
const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateInviteCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length])
    .join("");
}

/**
 * Format game start time as human-readable relative string.
 * Examples: "in 2h 30m", "in 15 minutes", "soon", "Mon, Jan 20"
 */
export function formatGameTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 24) {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } else if (diffHours > 0) {
    return `in ${diffHours}h ${diffMins}m`;
  } else if (diffMins > 0) {
    return `in ${diffMins} minutes`;
  }
  return "soon";
}
