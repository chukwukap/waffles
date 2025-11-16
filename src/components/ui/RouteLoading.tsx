"use client";

import { usePathname } from "next/navigation";
import { Spinner } from "./spinner";

// Map route paths to display names
const routeNameMap: Record<string, string> = {
  "/game": "Lobby",
  "/game/[gameId]/join": "Joining Game",
  "/game/[gameId]/live": "Live Game",
  "/game/[gameId]/ticket": "Get Ticket",
  "/game/[gameId]/score": "Score",
  "/leaderboard": "Leaderboard",
  "/profile": "Profile",
  "/profile/history": "Game History",
  "/profile/stats": "Stats",
  "/invite": "Invite Friends",
  "/waitlist": "Waitlist",
};

// Helper function to get route name from pathname
function getRouteName(pathname: string | null): string {
  if (!pathname) return "Loading";

  // Check for dynamic routes first
  if (pathname.includes("/game/") && pathname.includes("/join")) {
    return routeNameMap["/game/[gameId]/join"] || "Joining Game";
  }
  if (pathname.includes("/game/") && pathname.includes("/live")) {
    return routeNameMap["/game/[gameId]/live"] || "Live Game";
  }
  if (pathname.includes("/game/") && pathname.includes("/ticket")) {
    return routeNameMap["/game/[gameId]/ticket"] || "Get Ticket";
  }
  if (pathname.includes("/game/") && pathname.includes("/score")) {
    return routeNameMap["/game/[gameId]/score"] || "Score";
  }
  if (pathname.includes("/profile/history")) {
    return routeNameMap["/profile/history"] || "Game History";
  }
  if (pathname.includes("/profile/stats")) {
    return routeNameMap["/profile/stats"] || "Stats";
  }

  // Check exact matches
  if (pathname === "/game" || pathname.startsWith("/game/")) {
    return routeNameMap["/game"] || "Lobby";
  }
  if (pathname === "/leaderboard") {
    return routeNameMap["/leaderboard"] || "Leaderboard";
  }
  if (pathname === "/profile") {
    return routeNameMap["/profile"] || "Profile";
  }
  if (pathname === "/invite") {
    return routeNameMap["/invite"] || "Invite Friends";
  }
  if (pathname === "/waitlist") {
    return routeNameMap["/waitlist"] || "Waitlist";
  }

  // Fallback: capitalize first letter of last segment
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] || "Page";
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
}

export function RouteLoading() {
  const pathname = usePathname();
  const routeName = getRouteName(pathname);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
      <Spinner className="size-10" />
      <p className="text-white/60 text-sm font-display">{routeName}</p>
    </div>
  );
}

