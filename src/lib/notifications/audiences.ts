/**
 * Audience configuration for admin notifications.
 * Single source of truth for all audience types and their destinations.
 */

import { env } from "@/lib/env";
import type { UserFilter } from "./types";

export interface AudienceConfig {
  id: string;
  label: string;
  description: string;
  path: string;
  filter: UserFilter;
  color: string;
}

export const AUDIENCES = {
  all: {
    id: "all",
    label: "All Users",
    description: "Everyone with notifications",
    path: env.homeUrlPath || "/game",
    filter: "all" as const,
    color: "from-[#FFC931] to-[#FF9500]",
  },
  active: {
    id: "active",
    label: "Active Players",
    description: "Users with game access",
    path: "/game",
    filter: "active" as const,
    color: "from-[#14B985] to-[#0D8C65]",
  },
  waitlist: {
    id: "waitlist",
    label: "Waitlist",
    description: "Users waiting for access",
    path: "/waitlist",
    filter: "waitlist" as const,
    color: "from-[#00CFF2] to-[#0099B8]",
  },
  no_quests: {
    id: "no_quests",
    label: "No Quests",
    description: "Haven't done any quests",
    path: "/waitlist/quests",
    filter: "no_quests" as const,
    color: "from-[#FF6B6B] to-[#EE5A5A]",
  },
} as const;

export type AudienceId = keyof typeof AUDIENCES;

export const AUDIENCE_LIST = Object.values(AUDIENCES);

export function getAudienceUrl(audienceId: AudienceId): string {
  const config = AUDIENCES[audienceId];
  return `${env.rootUrl}${config.path}`;
}
