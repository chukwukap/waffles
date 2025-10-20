"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { HomeIcon, LeaderboardIcon, ProfileIcon } from "./icons";

const navItems = [
  { icon: HomeIcon, label: "Lobby", href: "/lobby" },
  { icon: LeaderboardIcon, label: "Leaderboard", href: "/leaderboard" },
  { icon: ProfileIcon, label: "Profile", href: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-figma noise border-t-2 border-border z-50">
      <div className="flex items-center justify-around max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Active if path starts with href as a segment (e.g. '/lobby' matches '/lobby/buy')
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-6 transition-colors flex-1 ",
                isActive
                  ? "text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 text-muted-foreground",
                  isActive && "animate-pulse-glow text-primary"
                )}
              />
              <span className="text-xs font-medium font-display">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
