// Shared task definitions used by both client and server

import { WAFFLE_FID } from "./constants";

// Define base types first to avoid circular dependencies
export type TaskActionType = "link" | "farcaster_share" | "invite";
export type TaskStatus = "initial" | "pending" | "completed";

export interface WaitlistTask {
  id: string;
  iconPath: string;
  title: string;
  text: string;
  points: number;
  actionUrl?: string;
  type: TaskActionType;
  verifiable?: boolean;
  targetFid?: number;
}

// Now define the tasks array with explicit type
export const TASKS: readonly WaitlistTask[] = [
  {
    id: "join_discord_general",
    iconPath: "/images/icons/discord.png",
    title: "Join Discord Community",
    text: "Join our Discord server and say hi in #general",
    points: 100,
    actionUrl: "https://discord.com/invite/F69CaAqVN",
    type: "link",
  },
  {
    id: "follow_playwaffles_twitter",
    iconPath: "/images/icons/x.png",
    title: "Follow on X",
    text: "Follow @playwaffles on X",
    points: 50,
    actionUrl: "https://x.com/playwaffles",
    type: "link",
  },
  {
    id: "retweet_playwaffles_launch_post",
    iconPath: "/images/icons/x.png",
    title: "Retweet Launch Post",
    text: "RT our pinned tweet about Waffles",
    points: 75,
    actionUrl: "https://x.com/playwaffles",
    type: "link",
  },
  {
    id: "follow_wafflesdotfun_farcaster",
    iconPath: "/images/icons/farcaster.png",
    title: "Follow on Farcaster",
    text: "Follow @wafflesdotfun on Farcaster",
    points: 50,
    actionUrl: "https://warpcast.com/wafflesdotfun",
    type: "link",
    verifiable: true,
    targetFid: WAFFLE_FID,
  },
  {
    id: "recast_waitlist_launch",
    iconPath: "/images/icons/farcaster.png",
    title: "Recast Launch Post",
    text: "Recast our waitlist launch post",
    points: 75,
    actionUrl: "https://farcaster.xyz/miniapps/sbpPNle-R2-V/waffles",
    type: "link",
  },
  {
    id: "share_waitlist_farcaster",
    iconPath: "/images/icons/farcaster.png",
    title: "cast about waffles",
    text: "Share something about waffles on farcaster and tag @wafflesdotfun",
    points: 100,
    type: "farcaster_share",
  },
  {
    id: "invite_three_friends",
    iconPath: "/images/icons/invite.png",
    title: "Invite Friends",
    text: "Get 3 friends to join the waitlist",
    points: 200,
    type: "invite",
  },
] as const;

// Export ID type derived from actual task IDs
export type WaitlistTaskId = (typeof TASKS)[number]["id"];
