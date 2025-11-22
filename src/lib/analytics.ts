import posthog from "posthog-js";

// Types for events
export type AnalyticsEvent =
  | "waitlist_joined"
  | "waitlist_referral"
  | "invite_redeemed"
  | "invite_failed"
  | "game_purchased"
  | "game_started"
  | "game_completed"
  | "task_completed";

export interface WaitlistJoinedProps {
  fid: number;
  hasReferrer: boolean;
  referrerFid?: number;
}

export interface InviteRedeemedProps {
  fid: number;
  inviterFid: number;
  code: string;
}

export interface InviteFailedProps {
  fid: number;
  reason: string;
  code?: string;
}

export interface GamePurchasedProps {
  fid: number;
  gameId: number;
  amount: number;
}

export interface TaskCompletedProps {
  fid: number;
  taskId: string;
}

// Initialize PostHog (client-side only)
export function initAnalytics() {
  if (typeof window === "undefined") return;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

  if (!apiKey) {
    console.warn("PostHog API key not found. Analytics disabled.");
    return;
  }

  posthog.init(apiKey, {
    api_host: apiHost,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") {
        posthog.debug();
      }
    },
    capture_pageview: false, // We'll manually capture
    capture_pageleave: true,
  });
}

// Identify user
export function identifyUser(fid: number, properties?: Record<string, any>) {
  if (typeof window === "undefined") return;
  posthog.identify(`fid_${fid}`, properties);
}

// Track events
export function track(event: AnalyticsEvent, properties?: Record<string, any>) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.capture(event, properties);
}

// Track page views
export function trackPageView() {
  if (typeof window === "undefined") return;
  posthog.capture("$pageview");
}

// Reset analytics (on logout)
export function resetAnalytics() {
  if (typeof window === "undefined") return;
  posthog.reset();
}
