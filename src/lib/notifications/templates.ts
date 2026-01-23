/**
 * Notification Templates
 *
 * Centralized notification content for all game lifecycle events.
 * Each template returns { title, body } for the notification payload.
 */

import { env } from "@/lib/env";

// ==========================================
// TYPES
// ==========================================

export interface NotificationTemplate {
  title: string;
  body: string;
}

type TemplateFunction<Args extends unknown[] = []> = (
  ...args: Args
) => NotificationTemplate;

// ==========================================
// PRE-GAME NOTIFICATIONS
// ==========================================

export const preGame = {
  /** When a new game is created and open for ticket purchases */
  gameOpen: ((gameNumber: number): NotificationTemplate => ({
    title: `Waffles #${String(gameNumber).padStart(3, "0")} is Open! 🚪`,
    body: "Tickets are available now. Grab yours before the rush!",
  })) as TemplateFunction<[number]>,

  /** 24 hours before game starts */
  countdown24h: ((gameNumber: number): NotificationTemplate => ({
    title: "24 Hours Left ⏳",
    body: `Waffles #${String(gameNumber).padStart(3, "0")} starts tomorrow. Secure your spot now.`,
  })) as TemplateFunction<[number]>,

  /** 12 hours before game starts */
  countdown12h: ((gameNumber: number): NotificationTemplate => ({
    title: "12 Hours to Go 🌗",
    body: "Tickets are selling fast. Don't get left behind!",
  })) as TemplateFunction<[number]>,

  /** 3 hours before game starts */
  countdown3h: ((gameNumber: number): NotificationTemplate => ({
    title: "3 Hours Warning ⚠️",
    body: `The window is closing. Lock in your ticket for Waffles #${String(gameNumber).padStart(3, "0")}!`,
  })) as TemplateFunction<[number]>,

  /** 1 hour before game starts */
  countdown1h: ((gameNumber: number): NotificationTemplate => ({
    title: "1 Hour Remaining 🚨",
    body: `This is your last chance to join Waffles #${String(gameNumber).padStart(3, "0")}. Hurry!`,
  })) as TemplateFunction<[number]>,

  /** 5 minutes before game starts */
  countdown5min: ((gameNumber: number): NotificationTemplate => ({
    title: "Starting in 5 Minutes! 🧨",
    body: "Game on! Get your ticket immediately or miss out.",
  })) as TemplateFunction<[number]>,
};

// ==========================================
// POST-GAME NOTIFICATIONS
// ==========================================

export const postGame = {
  /** Sent to top 3 winners */
  winner: ((gameNumber: number, rank: number): NotificationTemplate => {
    const emoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
    return {
      title: `You're a Winner! 🎉`,
      body: `You placed #${rank} ${emoji} in Waffles #${String(gameNumber).padStart(3, "0")}! Tap to see your prize.`,
    };
  }) as TemplateFunction<[number, number]>,

  /** Sent to winners with unclaimed prizes */
  topFinish: ((gameNumber: number, rank: number): NotificationTemplate => ({
    title: `Top ${rank} Finish! 🏆`,
    body: `You crushed Waffles #${String(gameNumber).padStart(3, "0")}! Claim your prize now.`,
  })) as TemplateFunction<[number, number]>,

  /** Sent to all non-winners */
  results: ((gameNumber: number): NotificationTemplate => ({
    title: `Waffles #${String(gameNumber).padStart(3, "0")} Results are in 📊`,
    body: "Not a winner this time? Check the final leaderboard here.",
  })) as TemplateFunction<[number]>,

  /** Reminder for unclaimed prizes */
  unclaimed: ((gameNumber: number, amount: string): NotificationTemplate => ({
    title: "You have unclaimed cash! 💸",
    body: `You won ${amount} in Waffles #${String(gameNumber).padStart(3, "0")}. Tap to claim your prize now.`,
  })) as TemplateFunction<[number, string]>,

  /** Confirmation when prize is claimed */
  claimed: ((amount: string): NotificationTemplate => ({
    title: "💰 Prize Claimed!",
    body: `Cha-ching! ${amount} has been sent to your wallet. Enjoy!`,
  })) as TemplateFunction<[string]>,
};

// ==========================================
// HELPER: Build full notification payload
// ==========================================

export type NotificationContext = "pregame" | "result" | "claim";

export function buildPayload(
  template: NotificationTemplate,
  gameId?: string,
  context: NotificationContext = "pregame",
): { title: string; body: string; targetUrl: string } {
  const baseUrl = env.rootUrl;

  // Route to appropriate page based on context
  let targetUrl: string;
  if (!gameId) {
    targetUrl = `${baseUrl}/game`;
  } else if (context === "result" || context === "claim") {
    targetUrl = `${baseUrl}/game/${gameId}/result`;
  } else {
    targetUrl = `${baseUrl}/game`; // Pre-game goes to lobby
  }

  return {
    title: template.title,
    body: template.body,
    targetUrl,
  };
}
