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
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t-2 border-border",
        "bg-figma noise",
        "shrink-0"
      )}
    >
      <div className="mx-auto flex max-w-2xl items-stretch justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 px-4 py-3",
                "transition-colors duration-150 ease-in-out",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              role="tab"
              aria-selected={isActive}
              aria-label={item.label}
            >
              <Icon
                className={cn("h-5 w-5", isActive && "animate-glow")}
                aria-hidden="true"
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
